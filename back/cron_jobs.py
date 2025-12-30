# back/cron_jobs.py
from sqlalchemy import text
from database import SessionLocal
from slack import send_slack_notification
from datetime import datetime, timedelta

# --- [Job 1] 월간 성장/현황 리포트 ---
def report_monthly_stats():
    db = SessionLocal()
    print("[System] 월간 통계 집계 중...")
    
    try:
        # 날짜 계산: 지난달 1일 ~ 이번달 1일 구간
        now = datetime.now()
        this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = this_month_start
        last_month_start = (last_month_end - timedelta(days=1)).replace(day=1)
        
        # 통계 쿼리 (PostgreSQL)
        # - total_users: 전체 유저 수
        # - new_users: 지난달에 처음으로 전투 기록을 남긴 신규 유저 수
        # - total_records: 전체 누적 전투 기록 수
        # - new_records: 지난달에 새로 쌓인 전투 기록 수
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
        
        # 슬랙 메시지 전송
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
        
        send_slack_notification(f"{title}\n{content}")
        print(f"[System] {month_str} 월간 리포트 전송 완료")

    except Exception as e:
        error_msg = f"⚠️ [오류] 월간 통계 집계 실패: {e}"
        print(error_msg)
        send_slack_notification(error_msg)
    finally:
        db.close()

# --- [Job 2] 유령 계정 탐지 리포트 ---
def report_ghost_users():
    db = SessionLocal()
    print("[System] 유령 계정 스캔 중...")
    
    try:
        # 전투(battle), 연구(progress), 모듈(modules) 기록이 모두 0인 계정 찾기
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
        
        # 발견된 유령 계정이 없으면 종료 (알림 안 보냄)
        if not results:
            print("[System] 유령 계정 없음.")
            return

        ghost_count = len(results)
        
        # 명단 텍스트 생성 (너무 길면 자르기)
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
        print(f"[Error] 유령 계정 스캔 실패: {e}")
    finally:
        db.close()