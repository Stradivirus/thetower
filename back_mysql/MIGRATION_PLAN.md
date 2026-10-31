# PostgreSQL 17 → Oracle MySQL HeatWave (MySQL 8.4) 이전 계획서

## 1. 개요 및 목표
- **목표**: 기존 PostgreSQL 17 기반 백엔드(`back/`)는 원본으로 유지하고, Oracle Cloud(OCI) MySQL HeatWave(MySQL 8.4 LTS 호환) 환경으로 이전하기 위한 별도 백엔드 디렉토리(`back_mysql/`)를 구축 및 검증합니다.
- **검증 전략**: OCI MySQL HeatWave는 VCN Private Subnet 내부에서만 접근 가능하므로, 로컬 WSL(Rocky Linux 10)에 설치된 **MySQL 8.4.11** 서버에서 스키마 생성, CRUD, 통계 쿼리, 기존 데이터 이관까지 선행 검증합니다.

---

## 2. 인프라 및 데이터베이스 환경 구성 (Step 1)
1. **WSL 로컬 MySQL 8.4 설정**
   - 서비스 상태: `mysqld.service` (MySQL 8.4.11 가동 완료)
   - 캐릭터셋/콜레이션: `utf8mb4` / `utf8mb4_unicode_ci`
   - 로컬 테스트용 DB 및 계정 생성 (`.env` 설정과 연동)
2. **Python 비동기 드라이버 패키지 구성 (`back_mysql/requirements.txt`)**
   - 기존 `psycopg2-binary`, `asyncpg` 대신 MySQL 비동기/동기 드라이버인 **`aiomysql`**, **`pymysql`**, **`cryptography`** 추가 (`caching_sha2_password` 인증 호환)

---

## 3. `back_mysql` 코드 수정 계획 (Step 2)

### 3.1 DB 연결 설정 (`back_mysql/database.py`)
- 환경 변수(`MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_SERVER`, `MYSQL_PORT`, `MYSQL_DB`, `MYSQL_SERVER_READ`) 지원 (미설정 시 기존 `POSTGRES_*` 변수 폴백 지원)
- 접속 URL 포맷 변경:
  ```python
  DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
  ```

### 3.2 ORM 모델 스키마 변환 (`back_mysql/models.py`)
1. **`JSONB` → `JSON` 타입 교체**
   - `from sqlalchemy.dialects.postgresql import JSONB` 제거 → `from sqlalchemy import JSON` 사용
   - 대상 테이블: `user_progress`, `user_modules`, `battle_mains`(`top_damages`), `battle_details`, `battle_details_v2`
2. **`String` 컬럼 길이(`VARCHAR`) 명시**
   - MySQL은 길이 없는 `VARCHAR`를 허용하지 않으며, 특히 PK/Index 컬럼에는 길이가 필수입니다.
   - `users.username`: `String(100)`
   - `users.hashed_password`: `String(255)`
   - `battle_mains.tier`, `game_time`, `real_time`, `killer`, `damage_dealt`, `damage_taken`: `String(50)` ~ `String(100)`
   - `monthly_summaries.month_key`: `String(7)` (`'YYYY-MM'`)
3. **`Numeric` 정밀도(`DECIMAL(65, 0)`) 명시**
   - MySQL에서 인자 없는 `Numeric`은 `DECIMAL(10, 0)`으로 생성되어 100억(`10^10`) 이상 코인/적 수치 저장 시 `Out of range` 에러가 발생합니다.
   - 게임 내 대용량 정수 수치(`coin_earned`, `coins_per_hour`, `cells_earned`, `reroll_shards_earned`, `total_coins` 등)를 MySQL 최대 정밀도인 **`Numeric(65, 0)`**으로 지정합니다.
4. **MySQL HeatWave 제약사항 준수 확인**
   - 모든 테이블 Primary Key 보유 여부 확인 완료 (`users`, `user_progress`, `user_modules`, `battle_mains`, `battle_details`, `tier_records`, `battle_mains_v2`, `battle_details_v2`, `monthly_summaries` 모두 PK 보유)

### 3.3 Raw SQL 문법 변환 (PostgreSQL → MySQL 8.4)
1. **`back_mysql/main.py` (`sync_monthly_summaries`)**
   - `TO_CHAR(battle_date, 'YYYY-MM')` → `DATE_FORMAT(battle_date, '%Y-%m')`
2. **`back_mysql/crud/report_queries.py` (`QUERY_REPORTS_WITH_RATIOS`)**
   - `m.death_wave_kills::numeric / m.total_enemies::numeric` 등 PostgreSQL 전용 `::numeric` 캐스팅 제거 → `ROUND((m.death_wave_kills / m.total_enemies * 100), 1)`
3. **`back_mysql/crud/stats.py` (`get_weekly_stats`, `get_weekly_trends`, `get_monthly_trends`)**
   - `TO_CHAR(battle_date, 'YYYY-MM-DD')` → `DATE_FORMAT(battle_date, '%Y-%m-%d')`
   - `TO_CHAR(battle_date, 'YYYY-MM')` → `DATE_FORMAT(battle_date, '%Y-%m')`
   - `((total_coins - prev_coins)::numeric / prev_coins * 100)::numeric` → `((total_coins - prev_coins) / prev_coins * 100)`
   - MySQL 8.4는 `WITH`(CTE) 및 `LAG() OVER()` 윈도우 함수를 네이티브로 지원하므로 쿼리 구조는 그대로 유지됩니다.

### 3.4 Raw SQL 조회 결과 후처리 (`back_mysql/crud/report_utils.py`)
- `aiomysql`에서 Raw SQL(`text()`)로 JSON 컬럼(`m.top_damages`)을 조회하면 Python `list`가 아닌 JSON 문자열(`str`)로 반환될 수 있습니다.
- `row_to_report_dict()`에서 `top_damages`가 `str`인 경우 `json.loads()`로 파싱하도록 안전장치를 추가합니다.

---

## 4. 데이터 이관 및 테스트 계획 (Step 3)
1. **스키마 생성 및 API 기동 테스트**
   - `back_mysql` 실행 시 `init_models()`를 통해 MySQL 8.4에 9개 테이블이 정상 생성되는지 확인
2. **PostgreSQL → MySQL 데이터 마이그레이션 스크립트 작성 (`back_mysql/migrate_pg_to_mysql.py`)**
   - 기존 PostgreSQL DB 데이터를 읽어 MySQL DB로 일괄 이관 (Users → Progress/Modules → BattleMains → Details/V2 → TierRecords/MonthlySummaries 순서로 FK 제약 준수)
3. **주요 엔드포인트 동작 검증**
   - 로그인/유저 조회, 리포트 목록/상세 조회, 주간/월간 통계 차트 쿼리, 리포트 업로드/삭제 테스트
