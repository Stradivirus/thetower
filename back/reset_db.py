from database import engine
from sqlalchemy import text

def reset_database():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            print("💥 기존 테이블 삭제 중...")
            conn.execute(text("DROP TABLE IF EXISTS user_progress CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS battle_details CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS battle_mains CASCADE;"))
            
            trans.commit()
            print("✅ DB 초기화 완료! (서버를 재시작하면 새 테이블이 생성됩니다)")
        except Exception as e:
            trans.rollback()
            print(f"❌ 에러 발생: {e}")

if __name__ == "__main__":
    reset_database()