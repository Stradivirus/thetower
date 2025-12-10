import os
import json
import urllib.request
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")

def send_slack_notification(message: str):
    """
    슬랙 웹훅으로 메시지를 전송합니다.
    실패하더라도 메인 로직(회원가입/데이터저장)에는 영향을 주지 않도록 예외 처리합니다.
    """
    if not SLACK_WEBHOOK_URL:
        print("[System] Slack Webhook URL not configured.")
        return

    payload = {"text": message}
    data = json.dumps(payload).encode("utf-8")
    
    try:
        req = urllib.request.Request(
            SLACK_WEBHOOK_URL, 
            data=data, 
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"[System] Failed to send Slack notification: Status {response.status}")
    except Exception as e:
        print(f"[System] Error sending Slack notification: {e}")