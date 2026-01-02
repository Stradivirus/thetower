import os
import json
import urllib.request
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# [기존] 시스템 알림용
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")
# [신규] 문의 접수용
SLACK_INQUIRY_URL = os.getenv("SLACK_INQUIRY_URL")

def _send_to_slack(url: str, payload: dict):
    """내부 전송용 공통 함수"""
    if not url:
        print(f"[System] Slack URL not configured for payload: {payload}")
        return

    data = json.dumps(payload).encode("utf-8")
    
    try:
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"[System] Failed to send Slack: Status {response.status}")
    except Exception as e:
        print(f"[System] Error sending Slack: {e}")

def send_slack_notification(message: str):
    """
    [기존] 시스템 알림 전송 (단순 텍스트)
    """
    payload = {"text": message}
    _send_to_slack(SLACK_WEBHOOK_URL, payload)

def send_inquiry(content: str):
    """
    [신규] 문의 접수 알림 전송 (Block Kit 사용)
    - contact 관련 로직 완전 삭제
    """
    
    # 블록 구성 (헤더 + 내용 + 푸터)
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "📬 새로운 문의 도착!",
                "emoji": True
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*📝 문의 내용:*\n{content}"
            }
        },
    ]

    payload = {
        "text": "📬 새로운 문의가 도착했습니다!",
        "blocks": blocks
    }
    
    _send_to_slack(SLACK_INQUIRY_URL, payload)