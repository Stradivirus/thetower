# back/main.py
import fcntl
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
# [Modified] support 라우터 추가
from routers import reports, auth, progress, modules, support
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from cron_jobs import report_monthly_stats, report_ghost_users

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300/minute"]
)
Base.metadata.create_all(bind=engine)

# 스케줄러 인스턴스
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. 파일 잠금 (Lock) - 워커가 여러 개여도 1명만 실행하도록 보장
    lock_file = open("scheduler.lock", "w")
    try:
        # 비차단(LOCK_NB) 모드로 잠금 시도 -> 실패하면 IOError 발생
        fcntl.lockf(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        
        # --- [스케줄러 등록] 1등 워커만 여기를 실행함 ---
        
        # Job 1: 월간 결산 (매월 1일 09:00)
        trigger_stats = CronTrigger(day=1, hour=9, minute=0, timezone="Asia/Seoul")
        scheduler.add_job(report_monthly_stats, trigger_stats, id="monthly_stats")
        
        # Job 2: 유령 계정 체크 (매월 1일 09:05) - 알림 겹치지 않게 5분 뒤
        trigger_ghost = CronTrigger(day=1, hour=9, minute=5, timezone="Asia/Seoul")
        scheduler.add_job(report_ghost_users, trigger_ghost, id="ghost_check")
        
        scheduler.start()
        
        print("[System] 👑 Main Worker: 스케줄러 가동됨 (매월 1일 09:00/09:05)")
        
    except IOError:
        # 잠금 획득 실패 = 다른 워커가 이미 돌리고 있음
        print("[System] Sub Worker: 스케줄러 이미 실행 중 -> Pass")
        pass

    yield  # 서버 실행 (이 시점에서 API 요청을 받음)
    
    # 서버 종료 시 정리
    if scheduler.running:
        scheduler.shutdown()
    lock_file.close()

# lifespan 적용
app = FastAPI(title="The Tower Battle Reports API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(progress.router)
app.include_router(modules.router)
app.include_router(support.router)

@app.get("/")
def root():
    return {"message": "The Tower Battle Reports API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)