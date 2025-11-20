from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import reports

# 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="The Tower Battle Reports API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(reports.router)

@app.get("/")
def root():
    return {"message": "The Tower Battle Reports API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)