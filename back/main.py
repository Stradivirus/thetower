"""
파일명: thetower/back/main.py
용도: FastAPI 애플리케이션 생성 및 초기 설정 (라우터 등록, 미들웨어, 스케줄러)
특징: APScheduler를 활용한 백그라운드 작업 관리 및 fcntl을 이용한 멀티 워커 중복 실행 방지
"""
import fcntl
import os
import time
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database import engine, engine_read, Base
from routers import reports, auth, progress, modules, support
from routers import max_wave as max_wave_router
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from cron_jobs import report_monthly_stats, report_ghost_users
from slack import send_slack_notification

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Rate Limit 설정: IP당 분당 300회 제한
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["600/minute"]
)

from sqlalchemy import text

# 테이블 생성 함수 (비동기)
async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# 기존 데이터 월별 요약 테이블 마이그레이션
async def sync_monthly_summaries():
    async with engine.begin() as conn:
        # 먼저 테이블이 비어 있는지 확인
        result = await conn.execute(text("SELECT COUNT(*) FROM monthly_summaries"))
        count = result.scalar() or 0
        if count == 0:
            print("[System] 🔄 monthly_summaries 테이블 마이그레이션 집계 시작...")
            await conn.execute(text("""
                INSERT INTO monthly_summaries (owner_id, month_key, count, total_coins, total_cells, total_shards)
                SELECT 
                    owner_id,
                    TO_CHAR(battle_date, 'YYYY-MM') as month_key,
                    COUNT(*) as count,
                    COALESCE(SUM(coin_earned), 0) as total_coins,
                    COALESCE(SUM(cells_earned), 0) as total_cells,
                    COALESCE(SUM(reroll_shards_earned), 0) as total_shards
                FROM battle_mains
                GROUP BY owner_id, TO_CHAR(battle_date, 'YYYY-MM')
            """))
            print("[System] 🔄 monthly_summaries 테이블 마이그레이션 완료!")

# 백그라운드 스케줄러 인스턴스 (비동기)
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI 애플리케이션 수명 주기 관리
    - 서버 시작 시: 스케줄러 잠금 획득 및 작업 등록, 테이블 생성, 요약 테이블 초기화
    - 서버 종료 시: 스케줄러 및 DB 커넥션 풀 정리
    """
    # 비동기로 테이블 생성
    await init_models()
    # 요약 테이블 마이그레이션 초기화
    await sync_monthly_summaries()

    # 1. 파일 잠금 (Lock) - 워커가 여러 개여도 1명만 실행하도록 보장
    lock_file = open("scheduler.lock", "w")
    try:
        # 비차단(LOCK_NB) 모드로 잠금 시도 -> 실패하면 IOError 발생
        fcntl.lockf(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        
        # --- [스케줄러 등록] 잠금을 획득한 메인 워커만 실행 ---
        
        # Job 1: 월간 결산 (매월 1일 09:00 KST)
        trigger_stats = CronTrigger(day=1, hour=9, minute=0, timezone="Asia/Seoul")
        scheduler.add_job(report_monthly_stats, trigger_stats, id="monthly_stats")
        
        # Job 2: 유령 계정 체크 (매월 1일 09:05 KST)
        trigger_ghost = CronTrigger(day=1, hour=9, minute=5, timezone="Asia/Seoul")
        scheduler.add_job(report_ghost_users, trigger_ghost, id="ghost_check")
        
        scheduler.start()
        print("[System] 👑 Main Worker: 스케줄러 가동됨 (매월 1일 09:00/09:05)")
        
    except IOError:
        # 잠금 획득 실패 = 다른 워커가 이미 스케줄러를 실행 중
        print("[System] Sub Worker: 스케줄러 이미 실행 중 -> Pass")
        pass

    yield  # 서버 실행 중 (API 요청 수신 가능 상태)
    
    # 서버 종료 시 리소스 정리
    if scheduler.running:
        scheduler.shutdown()
    lock_file.close()

    await engine.dispose()
    await engine_read.dispose()
    print("[System] DB Connection Pools Disposed")

# FastAPI 앱 객체 생성
app = FastAPI(title="The Tower Battle Reports API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://towerreport.o-r.kr",
        "https://towerreport.o-r.kr",
        "http://localhost",
        "http://frontend"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    API 응답 시간을 측정하고 1초(1000ms) 초과 시 슬랙 알림을 보냅니다.
    """
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = (time.perf_counter() - start_time) * 1000  # 밀리초 단위
    
    # 응답 헤더에 소요 시간 추가 (디버깅용)
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"

    # 5000ms 초과 시 슬랙 알림 (비동기 처리로 API 응답에 영향 없음)
    if process_time > 5000:
        path = request.url.path
        method = request.method
        msg = f"⏱️ *Slow API Alert*\n- *Path*: {method} {path}\n- *Duration*: {process_time:.2f}ms (Limit: 5000ms)"
        asyncio.create_task(asyncio.to_thread(send_slack_notification, msg))
        
    return response

# 기능별 라우터 등록
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(progress.router)
app.include_router(modules.router)
app.include_router(support.router)
app.include_router(max_wave_router.router)

@app.get("/api/test-slow")
async def test_slow():
    """테스트용: 1.5초 지연을 발생시켜 슬랙 알림을 유도합니다."""
    await asyncio.sleep(1.5)
    return {"message": "This was a slow request (1.5s delay)", "duration": "1500ms"}

@app.get("/")
def root():
    """헬스 체크용 엔드포인트"""
    return {"message": "The Tower Battle Reports API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True, forwarded_allow_ips="*")
