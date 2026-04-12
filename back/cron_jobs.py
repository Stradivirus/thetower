"""
파일명: thetower/back/cron_jobs.py
용도: 시스템 자동화 작업(Cron Jobs) 정의
기능: 월간 통계 결산 리포트 및 미활동(유령) 유저 탐지 알림
"""
from sqlalchemy import text
from database import SessionLocal
from slack import send_slack_notification
from datetime import datetime, timedelta

def report_monthly_stats():
    """
    [Job 1] 월간 성장/현황 리포트 생성 및 Slack 전송
    - 실행 주기: 매월 1일 09:00 KST (main.py 스케줄러 설정 기준)
    - 내용: 전체 유저 수, 신규 활동 유저, 누적 전투 기록 및 신규 기록 현황
    """
    db = SessionLocal()
    print("[System] 월간 통계 집계 중...")
    
    try:
        # 날짜 계산: 지난달 1일 00:00:00 ~ 이번달 1일 00:00:00 구간
        now = datetime.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = this_month_start
        last_month_start = (last_month_end - timedelta(days=1)).replace(day=1)
        
        # PostgreSQL 기반 집계 쿼리 수행
        sql = text("""
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                
                (SELECT COUNT(*) FROM (
                    SELECT owner_id, MIN(battle_date) as first_date 
                    FROM battle_mains 
                    GROUP BY owner_id
                ) sub WHERE first_date >= :start_date AND first_date < :end_date) as new_users,

                (SELECT COUNT(*) FROM battle_mains) as total_records,

                (SELECT COUNT(*) FROM battle_mains 
                 WHERE battle_date >= :start_date AND battle_date < :end_date) as new_records
        """)
        
        result = db.execute(sql, {"start_date": last_month_start, "end_date": last_month_end}).first()
        
        # 슬랙 메시지 구성
        month_str = last_month_start.strftime('%Y년 %m월')
        
        title = f"📅 *[{month_str} 월간 결산 리포트]*"
        content = (
            f"👥 *유저 현황*\n"
            f"• 총 유저: `{result.total_users:,}명`\n"
            f"• 신규 활동 유저: `+{result.new_users:,}명` (지난달 대비)\n\n"
            f"📝 *데이터 현황*\n"
            f"• 총 전투 기록: `{result.total_records:,}개`\n"
            f"• 새로 쌓인 기록: `+{result.new_records:,}개`"
        )
        
        # Slack 알림 전송
        send_slack_notification(f"{title}\n{content}")
        print(f"[System] {month_str} 월간 리포트 전송 완료")

    except Exception as e:
        error_msg = f"⚠️ [오류] 월간 통계 집계 실패: {e}"
        print(error_msg)
        send_slack_notification(error_msg)
    finally:
        db.close()

def report_ghost_users():
    """
    [Job 2] 유령 계정 탐지 리포트 생성
    - 실행 주기: 매월 1일 09:05 KST
    - 내용: 전투 기록, 진행도, 모듈 데이터가 전혀 없는 '껍데기' 계정을 찾아 Slack으로 알림
    """
    db = SessionLocal()
    print("[System] 유령 계정 스캔 중...")
    
    try:
        # 전투(battle), 연구(progress), 모듈(modules) 기록이 모두 0인 계정 스캔
        sql = text("""
            SELECT u.id, u.username
            FROM users u
            LEFT JOIN battle_mains b ON u.id = b.owner_id
            LEFT JOIN user_progress p ON u.id = p.user_id
            LEFT JOIN user_modules m ON u.id = m.user_id
            GROUP BY u.id, u.username
            HAVING COUNT(b.battle_date) = 0 
               AND COUNT(p.user_id) = 0 
               AND COUNT(m.user_id) = 0
            ORDER BY u.id ASC;
        """)
        
        results = db.execute(sql).fetchall()
        
        # 발견된 유령 계정이 없으면 작업 종료
        if not results:
            print("[System] 유령 계정 없음.")
            return

        ghost_count = len(results)
        
        # 사용자 명단 생성 (길이 제한 처리)
        user_list = [f"{r.username}({r.id})" for r in results]
        user_text = ", ".join(user_list)
        if len(user_text) > 500:
            user_text = user_text[:500] + "..."

        msg = (
            f"👻 *[유령 계정 정리 알림]*\n"
            f"데이터가 없는 껍데기 계정 *{ghost_count}개*가 발견되었습니다.\n"
            f"서버 용량 확보를 위해 삭제를 권장합니다.\n"
            f"```{user_text}```"
        )
        
        send_slack_notification(msg)
        print(f"[System] 유령 계정 리포트 전송 완료 ({ghost_count}명)")

    except Exception as e:
        error_msg = f"⚠️ [오류] 유령 계정 스캔 실패: {e}"
        print(error_msg)
        send_slack_notification(error_msg)
    finally:
        db.close()