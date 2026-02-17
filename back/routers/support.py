"""
파일명: thetower/back/routers/support.py
용도: 사용자 문의 및 지원 관련 API 라우터
기능: 사용자의 문의 내용을 받아 슬랙(Slack)으로 전송
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from slack import send_inquiry

router = APIRouter(
    prefix="/api/support",
    tags=["support"]
)

class InquiryRequest(BaseModel):
    """문의 요청 데이터 모델"""
    content: str

@router.post("")
async def create_inquiry(request: InquiryRequest):
    """
    사용자 문의 접수 API
    - 프론트엔드에서 받은 문의 내용을 슬랙 채널로 즉시 전송합니다.
    """
    if not request.content:
        raise HTTPException(status_code=400, detail="내용을 입력해주세요.")

    # 슬랙 전송 유틸리티 호출
    send_inquiry(request.content)
    
    return {"message": "문의가 성공적으로 접수되었습니다."}