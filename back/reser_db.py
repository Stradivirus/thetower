# back/reset_db.py
from database import engine
from sqlalchemy import text

def reset_database():
    with engine.connect() as conn:
        # 트랜잭션 시작
        trans = conn.begin()
        try:
            # 기존 테이블이 있다면 강제로 삭제 (CASCADE로 연관된 것까지 싹)
            print("💥 기존 테이블 삭제 중...")
            conn.execute(text("DROP TABLE IF EXISTS battle_details CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS battle_mains CASCADE;"))
            # 혹시 모를 옛날 테이블들도 삭제
            conn.execute(text("DROP TABLE IF EXISTS battle_reports CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS combat_stats CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS utility_stats CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS enemy_stats CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS bot_guardian_stats CASCADE;"))
            
            trans.commit()
            print("✅ DB 초기화 완료! (서버를 재시작하면 새 테이블이 생성됩니다)")
        except Exception as e:
            trans.rollback()
            print(f"❌ 에러 발생: {e}")

if __name__ == "__main__":
    reset_database()