from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import reports, auth, progress, modules # modules 추가

# 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="The Tower Battle Reports API")

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

@app.get("/")
def root():
    return {"message": "The Tower Battle Reports API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)