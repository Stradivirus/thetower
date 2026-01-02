from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from slack import send_inquiry

# 중요: prefix에 /api를 포함하고, URL 끝은 빈 문자열("")로 설정
router = APIRouter(
    prefix="/api/support",
    tags=["support"]
)

class InquiryRequest(BaseModel):
    content: str
    # contact 필드 삭제됨

@router.post("")
async def create_inquiry(request: InquiryRequest):
    """
    프론트엔드에서 문의 내용을 받아 슬랙으로 전송합니다.
    """
    if not request.content:
        raise HTTPException(status_code=400, detail="내용을 입력해주세요.")

    # contact 인자 제거
    send_inquiry(request.content)
    
    return {"message": "문의가 성공적으로 접수되었습니다."}