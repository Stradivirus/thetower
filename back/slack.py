"""
파일명: thetower/back/slack.py
용도: Slack Webhook을 이용한 알림 전송 유틸리티
기능: 일반 시스템 알림 및 사용자 문의(Block Kit 형식) 알림 전송
"""
import os
import json
import urllib.request
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 시스템 알림 및 문의 접수용 Webhook URL
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")
SLACK_INQUIRY_URL = os.getenv("SLACK_INQUIRY_URL")

def _send_to_slack(url: str, payload: dict):
    """
    Slack Webhook으로 JSON 데이터를 전송하는 내부 함수
    :param url: Slack Webhook URL
    :param payload: 전송할 데이터 (딕셔너리)
    """
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
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status != 200:
                print(f"[System] Failed to send Slack: Status {response.status}")
    except Exception as e:
        print(f"[System] Error sending Slack: {e}")

def send_slack_notification(message: str):
    """
    일반 텍스트 형식의 시스템 알림을 Slack으로 전송
    :param message: 전송할 메시지 문자열
    """
    payload = {"text": message}
    _send_to_slack(SLACK_WEBHOOK_URL, payload)

def send_inquiry(content: str):
    """
    사용자 문의 사항을 Slack의 Block Kit 형식을 사용하여 미려하게 전송
    :param content: 문의 내용 문자열
    """
    # Slack Block Kit 구성
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