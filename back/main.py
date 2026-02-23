"""
파일명: thetower/back/main.py
용도: FastAPI 애플리케이션 생성 및 초기 설정 (라우터 등록, 미들웨어, 스케줄러)
특징: APScheduler를 활용한 백그라운드 작업 관리 및 fcntl을 이용한 멀티 워커 중복 실행 방지
"""
import fcntl
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, engine_read, Base
from routers import reports, auth, progress, modules, support
from routers import max_wave as max_wave_router
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from cron_jobs import report_monthly_stats, report_ghost_users

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Rate Limit 설정: IP당 분당 300회 제한
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["600/minute"]
)

# 테이블 생성 (Main DB에서 실행)
Base.metadata.create_all(bind=engine)

# 백그라운드 스케줄러 인스턴스
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI 애플리케이션 수명 주기 관리
    - 서버 시작 시: 스케줄러 잠금 획득 및 작업 등록
    - 서버 종료 시: 스케줄러 및 DB 커넥션 풀 정리
    """
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

    engine.dispose()
    engine_read.dispose()
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

# 기능별 라우터 등록
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(progress.router)
app.include_router(modules.router)
app.include_router(support.router)
app.include_router(max_wave_router.router)

@app.get("/")
def root():
    """헬스 체크용 엔드포인트"""
    return {"message": "The Tower Battle Reports API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True, forwarded_allow_ips="*")