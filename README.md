# 🏰 The Tower Analysis Project

본 프로젝트는 게임 'The Tower'의 전투 데이터를 수집하고, 차트 및 위젯을 통해 성장을 시각적으로 분석하는 통합 웹 애플리케이션입니다.

## 🛠 기술 스택 (Tech Stack)

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts (차트), Lucide-react (아이콘)
* **Backend**: FastAPI (Python), SQLAlchemy (ORM), Pydantic (검증)
* **Database**: PostgreSQL
* **Infrastructure**: Docker Compose, Jenkins (CI/CD), Caddy (Web Server)

---

## 📂 프로젝트 구조 (Project Structure)

### 💻 Frontend (`front/`)

#### 핵심 기술 스택
* **Vite + React 18 + TypeScript**: 
  - Fast Refresh (HMR)
  - 코드 스플리팅 및 트리 쉐이킹
  - Lazy Loading으로 초기 로딩 최적화
* **TailwindCSS**: 
  - 유틸리티 우선 CSS
  - 커스텀 애니메이션 (`animate-fade-in`, `animate-pulse`)
  - 반응형 디자인 (Mobile-First)
* **React Router v6**: 클라이언트 사이드 라우팅
* **Recharts**: 인터랙티브 차트 라이브러리
* **Lucide Icons**: 경량 아이콘 시스템

#### 주요 페이지 및 기능

##### 1. **메인 페이지** (`MainPage.tsx`)
- **대시보드 위젯**: 
  - 최근 3일 코인 획득 흐름 (Today/Yesterday/2 Days Ago)
  - 오늘 주요 자원 (Cells/Reroll Shards)
  - 최근 1주일 죽음 원인 Top 3 (빈도 기반)
  - 주간 딜 순위 Top 3 (출현 빈도 기반)
- **티어별 최고 웨이브 위젯** (`TierRecordWidget.tsx`):
  - 실시간 서버 최고 기록 vs 내 최고 기록 비교
  - 티어 범위 필터링 (Min/Max Tier 설정)
  - 위젯 Show/Hide 토글
  - 티어 클릭 시 해당 티어 기록으로 자동 이동
- **전투 기록 리스트**: 최근 2일 기록 우선 표시

##### 2. **기록 보관소** (`HistoryPage.tsx`)
- **3가지 뷰 모드**:
  - 📊 **성장 분석 차트** (일간/주간/월간)
  - 📁 **월별 그룹 뷰** (최근 7일 + 월별 접기/펼치기)
  - 📋 **전체 리스트 뷰**
- **고급 필터링**:
  - 토너먼트 필터 (Only/Exclude/All)
  - 메모 필터 (메모가 있는 기록만)
  - 티어 필터 (Widget 연동, URL 파라미터)
- **성장 분석 차트** (`WeeklyStatsChart.tsx`):
  - **일간 뷰**: 최근 7일 데이터
  - **주간 뷰**: 최근 8주 데이터
  - **월간 뷰**: 최근 6개월 데이터 (진행 중 월 표시)
  - **이중 Y축**: 코인/셀 획득량 (Bar) + 성장률 (Line)
  - **추세선**: Linear Regression 기반 예측
  - **실시간 통계**: 총 획득량, 평균 획득량, 평균 성장률

##### 3. **전투 기록 상세** (`ReportDetail.tsx`)
- **전투 통계 분석** (`CombatAnalysis.tsx`):
  - 주요 딜러 Top 5 (파이 차트 형태 바)
  - 슈퍼 딜러 강조 (50% 이상 딜량 시 번개 아이콘)
  - 기타 딜러 섹션 (1% 미만 딜러 접기/펼치기)
  - 방어 통계 (받은 대미지, 장벽 피해, 생명력 흡수 등)
- **4개 섹션 그리드** (`StatGrid.tsx`):
  - 유틸리티 (코인 관련 / 기타)
  - 적 통계 (일반 유닛 / 엘리트 유닛 / 처치 통계)
  - 봇 & 가디언 (자원 / 파편 & 봇)
  - 기타 스탯
- **지능형 레이아웃**:
  - 유틸리티: 좌측 "코인 유틸리티" / 우측 "기타"
  - 적 통계: 상단 2열 (일반/엘리트) / 하단 처치 방법
  - 봇: 좌측 "자원" / 우측 "파편 & 봇"

##### 4. **모듈 관리** (`ModulesInfoPage.tsx`)
- **3가지 뷰 모드**:
  - ⚙️ **장착 모듈 뷰**: Main/Assist 슬롯별 표시
  - 📦 **인벤토리 뷰**: 보유 중인 모듈 전체 목록
  - 🎲 **리롤 시뮬레이터**: 실시간 리롤 확률 계산
- **모듈 상세 편집 모달** (`ModuleDetailModal.tsx`):
  - 등급 선택 (Epic ~ Ancestral)
  - 부옵션 8개 슬롯 직접 편집
  - Main/Assist 장착/해제 원클릭
  - 즉시 저장 (DB 반영)
- **리롤 시뮬레이터** (`RerollPanel.tsx`):
  - **4개 모듈 타입**: Cannon/Armor/Generator/Core
  - **실시간 시뮬레이션**: 20ms 간격 리롤 (속도감 있는 애니메이션)
  - **Target Wishlist**: 원하는 옵션 체크 (최대 8개)
  - **Ban Wishlist**: 원치 않는 옵션 밴 (타입별 3~7개)
  - **Lab 효과**: 밴 개수 선택 (Ban 0~7)
  - **수동 잠금**: 슬롯 클릭해서 옵션 직접 고정
  - **스마트 활성화**: 수동 잠금 + 타겟 개수만큼만 리롤
  - **실시간 비용 계산**: 잠금 개수 기반 비용 추적
  - **통계 패널**: 
    - 확률표 (Epic ~ Ancestral)
    - 비용표 (Lock 0~7)

##### 5. **스톤 비용 계산기** (`StonesPage.tsx`)
- **5개 탭**:
  - 🔓 **Unlock**: UW/UW+ 및 모듈 슬롯 해금
  - ⚡ **Base Stats**: 궁극 무기 기본 스탯
  - ➕ **UW+ Stats**: 궁극 무기 플러스 스탯
  - 🃏 **Cards**: 카드 마스터리
  - 📦 **Modules**: 모듈 효율 업그레이드
- **총 스톤 사용량 실시간 계산**
- **일괄 업그레이드**: 한 번 클릭으로 여러 단계 업그레이드
- **Lab 효과 토글**: GT Duration/Bonus, CF Duration
- **로컬 스토리지 동기화**: 브라우저 종료 후에도 데이터 유지
- **요약 모달** (`SummaryModal.tsx`):
  - 장착 모듈 4종 (타입별 네온 테두리)
  - 완료된 카드 마스터리 배지
  - 궁극 무기 레벨별 정리

#### 상태 관리 및 데이터 흐름

##### Context API 활용
- **GameDataContext** (`contexts/GameDataContext.tsx`):
  - Progress (진행 상황) 및 Modules (모듈 데이터) 전역 관리
  - 로그인 상태 추적 (`isLoggedIn`)
  - `refreshData()`: API 재호출로 최신 데이터 동기화
  - 컴포넌트 간 props drilling 방지

##### API 통신
- **fetchWithAuth** (`utils/apiConfig.ts`):
  - JWT 토큰 자동 첨부
  - 401 에러 시 자동 로그아웃 및 이벤트 발생
  - FormData 전송 시 Content-Type 자동 처리
- **주요 API 파일**:
  - `api/auth.ts`: 로그인/회원가입 (OAuth2 Form 인코딩)
  - `api/reports.ts`: 전투 기록 CRUD, 통계 조회
  - `api/modules.ts`: 모듈 데이터 저장/불러오기
  - `api/progress.ts`: 진행 상황 저장/불러오기
  - `api/stats.ts`: 티어별 최고 웨이브 조회

##### 커스텀 훅
- **useRerollSimulation** (`hooks/useRerollSimulation.ts`):
  - 리롤 시뮬레이션 로직 (확률 계산, 잠금 처리)
  - 수동 슬롯 설정 (`manualSetSlot`)
  - 총 비용 추적
- **useStonesData** (`hooks/useStonesData.ts`):
  - 스톤 계산기 상태 관리
  - 일괄 업데이트 (`updateBatch`)
  - 로컬 스토리지 동기화
- **useGrowthStats** (`hooks/useGrowthStats.ts`):
  - 성장 분석 차트 데이터 가공
  - Linear Regression 추세선 계산
  - 일간/주간/월간 데이터 전환
- **useEscKey** (`hooks/useEscKey.ts`):
  - ESC 키로 모달 닫기 (UX 개선)

#### 다국어 지원 (i18n)

**언어팩 시스템** (`locales/`)
- **현재 지원 언어**: 한국어(KR), 영어(EN)
- **구조**: 
  ```
  locales/
  ├── index.ts        # 언어 전환 함수 (toggleLanguage)
  ├── kr/
  │   ├── index.ts    # KR 통합 내보내기
  │   ├── common.ts   # 공통 텍스트
  │   ├── auth.ts     # 인증 관련
  │   ├── main.ts     # 메인 페이지
  │   ├── detail.ts   # 상세 페이지
  │   ├── history.ts  # 기록실
  │   ├── layout.ts   # 레이아웃
  │   ├── summary.ts  # 요약 모달
  │   └── data.ts     # 게임 데이터 (카드, 모듈, UW 이름/설명)
  └── en/ (동일 구조)
  ```
- **사용 방법**: 
  ```typescript
  import { T } from './locales';
  
  <h1>{T.main.PAGE.TITLE}</h1>
  <button>{T.common.SAVE}</button>
  ```
- **언어 전환**: NavBar 우측 상단 Languages 버튼 (KR ⇄ EN)
- **로컬 스토리지 저장**: `localStorage.getItem('site_lang')`

#### 고급 UI/UX 기능

##### 1. **반응형 디자인**
- **Mobile-First 접근**:
  - 모바일: 단일 컬럼 레이아웃
  - 태블릿: 2컬럼 그리드
  - 데스크톱: 3~4컬럼 그리드
- **컴포넌트별 반응형 분기**:
  - `ReportListItem`: Mobile/Desktop 전용 렌더링
  - `HistoryMonthGroup`: 모바일 세로 정렬, 데스크톱 가로 정렬
  - `WeeklyStatsChart`: 모바일 세로 범례, 데스크톱 가로 범례

##### 2. **애니메이션 및 트랜지션**
- **Fade-in 애니메이션**: 모든 페이지 전환 시
- **Pulse 효과**: 중요 알림 (Ban 모드, Next 업그레이드)
- **Hover 효과**: 버튼, 카드, 리스트 아이템
- **Loading States**: 스켈레톤 UI 및 Spinner

##### 3. **인터랙티브 요소**
- **클릭 투 액션**: 
  - 티어 클릭 → 기록실 이동
  - 월 클릭 → 월별 기록 펼치기
  - 스탯 클릭 → 업그레이드 실행
- **컨텍스트 메뉴**: 삭제 확인 팝업 (마우스 위치 기반)

##### 4. **데이터 시각화**
- **Recharts 활용**:
  - ComposedChart (Bar + Line 조합)
  - 이중 Y축 (좌: 획득량, 우: 성장률)
  - 커스텀 툴팁 (색상, 포맷팅)
  - 그라데이션 라인 (증가 빨강, 감소 파랑)
- **커스텀 차트**:
  - 파이 차트 형태의 딜량 바 (CombatAnalysis)
  - 네온 효과 진행 바 (ModuleTab)

##### 5. **성능 최적화**
- **useMemo / useCallback**: 불필요한 재계산 방지
- **React.memo**: 자식 컴포넌트 리렌더링 최소화
- **Lazy Loading**: 
  ```typescript
  const HistoryPage = lazy(() => import('./pages/HistoryPage'));
  ```
- **코드 스플리팅**: Vite 자동 처리 (Chunk 분리)

##### 6. **에러 처리 및 사용자 피드백**
- **Try-Catch 블록**: 모든 API 호출
- **로딩 상태**: 
  - `isSaving`, `isLoading` 상태
  - Disabled 버튼 (중복 클릭 방지)
- **빈 상태 UI**: "데이터 없음" 메시지 + 아이콘

#### 파일 구조

```
front/src/
├── components/
│   ├── Auth/                 # 로그인/회원가입 모달
│   ├── Detail/               # 전투 기록 상세 컴포넌트
│   ├── History/              # 기록실 차트 및 그룹 뷰
│   ├── Layout/               # NavBar, SupportButton
│   ├── Main/                 # 대시보드, 리스트, 티어 위젯
│   ├── Modal/                # 요약 모달 (모듈, 카드, UW)
│   ├── Modules/              # 모듈 컬럼, 리롤 시뮬레이터
│   └── Stones/               # 스톤 계산기 탭별 컴포넌트
├── pages/                    # 페이지 컴포넌트
├── api/                      # API 호출 함수
├── contexts/                 # Context API
├── hooks/                    # 커스텀 훅
├── locales/                  # 다국어 언어팩
├── types/                    # TypeScript 타입 정의
├── utils/                    # 유틸리티 함수
├── constants/                # 상수 (reportRules 등)
├── data/                     # 정적 JSON 데이터
├── App.tsx                   # 루트 컴포넌트
└── main.tsx                  # 엔트리 포인트
```

#### 주요 기술적 특징

**1. 타입 안정성**
- 모든 API 응답 타입 정의 (`types/report.ts`, `types/gameData.ts`)
- Props Interface 명시
- TypeScript Strict Mode

**2. 코드 재사용성**
- 공통 컴포넌트 추출 (`ResetButton`, `StatGrid`)
- 커스텀 훅 분리
- 유틸리티 함수 모듈화

**3. 확장성**
- 모듈식 구조 (기능별 폴더 분리)
- 언어팩 시스템 (새 언어 추가 용이)
- 테마 확장 가능 (Tailwind Config)

**4. 접근성 (A11y)**
- 시맨틱 HTML (`<nav>`, `<main>`, `<button>`)
- Aria 속성 (title, role)
- 키보드 네비게이션 (ESC, Enter)

**5. 보안**
- JWT 토큰 자동 관리
- XSS 방지 (React 기본 이스케이핑)
- CSRF 방지 (SameSite Cookie)

### ⚙️ Backend (`back/`)

* **`routers/`**: 기능별 API 엔드포인트 관리
  - `auth.py`: 회원가입, 로그인 (JWT 토큰 발급)
  - `reports.py`: 전투 기록 CRUD 및 통계 조회
  - `progress.py`: 게임 진행도 동기화
  - `modules.py`: 모듈 인벤토리 관리
  - `max_wave.py`: 티어별 최고 기록 조회
  - `support.py`: 문의 접수 및 Slack 연동
* **`crud/`**: 데이터베이스 레이어 로직
  - `report.py`: 전투 기록 저장 및 조회 최적화
  - `stats.py`: 일간/주간/월간 통계 집계 (WITH절, LAG 함수 활용)
  - `max_wave.py`: 서버 최고 기록 갱신 시스템
* **`parser.py`**: 지능형 게임 데이터 파싱 엔진
  - 다국어(한글/영문) 자동 감지 및 처리
  - 게임 내 단위 변환 (k, M, B, T, q, Q, s, S 등)
  - Top Damage 자동 계산 및 순위화
* **`auth.py`**: 보안 시스템
  - JWT 기반 토큰 인증
  - bcrypt 비밀번호 해싱
  - OAuth2 표준 준수
* **`cron_jobs.py`**: 스케줄러 작업
  - 월간 통계 리포트 (매월 1일 09:00 KST)
  - 유령 계정 탐지 및 알림 (매월 1일 09:05 KST)
* **`slack.py`**: Slack 알림 통합
  - 시스템 알림 (기록 마일스톤, 통계)
  - 문의 접수 알림 (Block Kit 활용)
* **`mappings.py`**: 다국어 데이터 매핑 테이블
  - 섹션 헤더 통합 (Battle Report / 전투 보고)
  - 키-값 표준화 (Coins earned / 코인 획득)

### 🏗 Infrastructure (`docker/`)

#### Docker 컨테이너 구성
* **`frontend.Dockerfile`**: 
  - **멀티 스테이지 빌드**: Node.js 빌드 스테이지 → Caddy 서빙 스테이지
  - **이미지 최적화**: 최종 이미지 크기 대폭 감소 (빌드 도구 제외)
  - **HTTP/3 지원**: QUIC 프로토콜 지원 (443/udp)
* **`backend.Dockerfile`**:
  - **Python 3.12 slim**: 경량화된 베이스 이미지
  - **Gunicorn + Uvicorn**: 
    - Worker 2개 (비동기 ASGI 지원)
    - Uvicorn Worker Class 사용
* **`docker-compose.yml`**:
  - 서비스 간 의존성 관리 (`depends_on`)
  - 볼륨 영구화 (`caddy_data`, `caddy_config`)
  - 환경 변수 주입 (`.env` 파일)

#### Caddy 웹서버 설정 (`Caddyfile`)
* **자동 HTTPS**: Let's Encrypt 인증서 자동 발급 및 갱신
* **보안 헤더 자동 적용**:
  ```
  X-Frame-Options: SAMEORIGIN          # 클릭재킹 방지
  X-Content-Type-Options: nosniff      # MIME 스니핑 차단
  Strict-Transport-Security: HSTS      # HTTPS 강제
  Referrer-Policy: 엄격한 리퍼러 정책
  -Server: 버전 정보 숨김
  ```
* **스마트 캐싱 전략**:
  - 정적 파일 (`/assets/*`, `.js`, `.css`): **1년 캐시 (immutable)**
  - `index.html`: **no-cache** (즉시 반영)
* **리버스 프록시**: `/api/*` 요청을 Backend 컨테이너로 전달
* **SPA 라우팅 지원**: `try_files`로 클라이언트 사이드 라우팅 처리

#### 네트워크 구조
```
[사용자] 
   ↓
[Caddy :80/:443] (Frontend Container)
   ↓ (정적 파일 서빙)
   ↓ (/api/* → 리버스 프록시)
   ↓
[Gunicorn :8000] (Backend Container)
   ↓
[PostgreSQL Primary/Replica]
```

#### Jenkins CI/CD 파이프라인 (`Jenkinsfile`)

##### 스마트 빌드 시스템
* **변경 감지 로직**: Git diff 기반 선택적 빌드
  ```
  front/ 변경    → Frontend만 재빌드
  back/ 변경     → Backend만 재빌드
  docker/ 변경   → 전체 --no-cache 재빌드
  docker-compose.yml 변경 → 전체 재빌드
  ```
* **캐시 활용**: 변경되지 않은 서비스는 Docker 레이어 캐시 활용
* **병렬 빌드**: Frontend/Backend 동시 빌드로 배포 시간 단축

##### 자동화된 배포 프로세스
1. **워크스페이스 정리**: Docker 컨테이너로 root 권한 정리
2. **코드 체크아웃**: `production` 브랜치에서 최신 코드 가져오기
3. **환경 변수 주입**: Jenkins에서 `.env` 파일 자동 생성
4. **선택적 빌드**: 변경된 서비스만 빌드 및 재시작
5. **헬스 체크**: 서비스 정상 작동 확인
6. **CloudFront 캐시 무효화**: Frontend 변경 시 `/index.html` 무효화
7. **자동 롤백**: 배포 실패 시 이전 버전으로 자동 복구

##### 스케줄 및 트리거
* **폴링 스케줄**: 매일 17:00 KST 자동 배포 체크
* **수동 트리거**: Jenkins 대시보드에서 즉시 배포 가능

---

## 🔐 보안 및 인증 (Security & Authentication)

### JWT 기반 토큰 시스템
* **토큰 발급**: 로그인 성공 시 Access Token 자동 생성 (유효기간: 30분)
* **암호화**: HS256 알고리즘을 사용한 안전한 토큰 서명
* **검증**: 모든 보호된 API 엔드포인트에서 자동으로 토큰 유효성 검증

### 비밀번호 보안
* **Bcrypt 해싱**: 단방향 해시 함수로 비밀번호 암호화 저장
* **Salt 자동 생성**: 레인보우 테이블 공격 방지
* **최소 길이 검증**: 아이디/비밀번호 모두 4자 이상 필수

### Rate Limiting
* **요청 제한**: IP당 분당 300회 요청 제한
* **SlowAPI**: FastAPI 통합 Rate Limiter 사용
* **DDoS 방어**: 과도한 트래픽으로부터 서버 보호

---

## 📡 API 엔드포인트 (API Endpoints)

### 🔑 인증 (`/api/auth`)
```
POST /api/auth/register  - 회원가입
POST /api/auth/login     - 로그인 (JWT 토큰 발급)
```

### 📊 전투 기록 (`/api/reports`)
```
POST   /api/reports/              - 리포트 업로드 (텍스트 파싱)
GET    /api/reports/view          - 기록실 뷰 (최근 7일 + 월별 요약)
GET    /api/reports/recent        - 최근 7일 상세 기록
GET    /api/reports/history       - 전체 기록 조회 (페이징)
GET    /api/reports/month/{key}   - 특정 월 기록 조회
GET    /api/reports/{date}        - 단일 기록 상세 조회
DELETE /api/reports/{date}        - 기록 삭제
GET    /api/reports/weekly-stats  - 일간 통계 (7일)
GET    /api/reports/weekly-trends - 주간 트렌드 (8주)
GET    /api/reports/monthly-trends- 월간 트렌드 (6개월)
```

### 🎮 게임 데이터 (`/api/progress`, `/api/modules`)
```
GET  /api/progress/  - 진행도 조회
POST /api/progress/  - 진행도 저장
GET  /api/modules/   - 모듈 인벤토리 조회
POST /api/modules/   - 모듈 인벤토리 저장
```

### 🏆 최고 기록 (`/api/max-waves`)
```
GET /api/max-waves  - 티어별 서버/개인 최고 기록 조회
```

### 💬 지원 (`/api/support`)
```
POST /api/support  - 문의 접수 (Slack 연동)
```

---

## ⚡ 성능 최적화 (Performance Optimization)

### 데이터베이스 최적화
* **인덱싱**: 복합 인덱스 `idx_owner_date` (owner_id + battle_date) 적용
* **쿼리 최적화**:
  - CTE(WITH절)를 활용한 복잡한 집계 쿼리 최적화
  - 윈도우 함수(LAG, LEAD) 사용으로 자체 조인 제거
  - 불필요한 JOIN 제거 (BattleMain/Detail 분리 조회)
* **커넥션 풀링**:
  ```python
  # Primary DB (쓰기/리스트)
  pool_size=3, max_overflow=12
  
  # Replica DB (상세 조회)
  pool_size=2, max_overflow=8
  ```

### 백엔드 최적화
* **JSON 변경 감지**: SQLAlchemy `flag_modified`로 JSONB 필드 업데이트 보장
* **트랜잭션 관리**: 읽기 전용 작업은 Replica DB로 라우팅
* **비동기 처리**: BackgroundTasks를 활용한 Slack 알림 비동기 전송
* **캐싱**: 정적 파일은 Caddy를 통한 HTTP 캐싱 적용

### 프론트엔드 최적화
* **코드 스플리팅**: Vite 기반 동적 import로 초기 로딩 시간 단축
* **트리 쉐이킹**: 미사용 코드 자동 제거
* **이미지 최적화**: WebP 포맷 지원 및 Lazy Loading

---

## 🚀 배포 환경 (Deployment Environment)

### 서버 아키텍처
```
┌─────────────────────────────────────────┐
│         CloudFront (CDN)                │
│    - 정적 파일 캐싱                      │
│    - HTTPS 암호화                        │
│    - Gzip 압축                           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      EC2 Instance (Jenkins)             │
│  ┌───────────────────────────────────┐  │
│  │  Docker Compose                   │  │
│  │  ├─ Frontend (Caddy:2-alpine)    │  │
│  │  │   - 자동 HTTPS (Let's Encrypt)│  │
│  │  │   - HTTP/3 지원               │  │
│  │  │   - 리버스 프록시             │  │
│  │  │                               │  │
│  │  └─ Backend (Python:3.12-slim)   │  │
│  │      - Gunicorn (2 workers)      │  │
│  │      - Uvicorn ASGI              │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      PostgreSQL Cluster                 │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │   Primary    │  │    Replica      │ │
│  │ 1 OCPU/6GB  │◄─┤  1 OCPU/1GB    │ │
│  │ (쓰기/리스트)│  │  (상세 조회)    │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
```

### 환경 변수 구성
Jenkins에서 자동으로 주입되는 환경 변수:
```bash
# 데이터베이스
POSTGRES_USER=thetower
POSTGRES_SERVER=10.0.0.6          # Primary (쓰기)
POSTGRES_SERVER_READ=10.0.0.188   # Replica (읽기)
POSTGRES_DB=thetower_report
POSTGRES_PORT=5432

# 보안
SECRET_KEY=<JWT 서명 키>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=720    # 12시간

# 알림
SLACK_WEBHOOK_URL=<시스템 알림용>
SLACK_INQUIRY_URL=<문의 접수용>

# AWS
CLOUDFRONT_DISTRIBUTION_ID=<CDN ID>
AWS_DEFAULT_REGION=ap-northeast-2
```

### 배포 프로세스
1. **코드 푸시**: GitHub `production` 브랜치로 푸시
2. **자동 감지**: Jenkins가 매일 17:00 또는 수동 트리거로 변경 감지
3. **변경 분석**: Git diff로 Front/Back/Docker 변경 여부 확인
4. **선택적 빌드**: 
   - 변경된 서비스만 재빌드
   - Docker 설정 변경 시 전체 `--no-cache` 재빌드
5. **무중단 배포**:
   ```bash
   docker compose stop [service]
   docker compose build [service]
   docker compose up -d [service]
   ```
6. **헬스 체크**: Backend `/` 엔드포인트 응답 확인
7. **CDN 캐시 무효화**: CloudFront `/index.html` 무효화
8. **알림**: 배포 성공/실패 로그 기록

### 모니터링 및 롤백
* **헬스 체크**: `docker compose ps`로 컨테이너 상태 확인
* **로그 수집**: `docker compose logs -f [service]`
* **자동 롤백**: 배포 실패 시 Jenkins가 자동으로 이전 컨테이너 재시작
* **수동 롤백**: 
  ```bash
  cd docker
  git checkout <previous-commit>
  docker compose up -d --force-recreate
  ```

---

## 🌟 주요 기능 (Key Features)

### 1. 지능형 성장 분석 차트 (`WeeklyStatsChart`)

* **시각화**: 코인 및 셀 획득량을 일간/주간/월간 단위로 분석하여 막대 그래프와 추세선으로 표시합니다.
* **성장률 추적**: 이전 기간 대비 성장률을 계산하여 직관적인 지표로 제공합니다.
* **UI 최적화**: 툴팁에서 불필요한 예측치를 제거하고 [금액 → 성장률] 순으로 데이터를 정렬하여 가독성을 높였습니다.

### 2. 티어별 기록 연동 위젯 (`TierRecordWidget`)

* **실시간 모니터링**: 사용자의 티어별 최고 웨이브와 서버 최고 기록을 실시간으로 비교합니다.
* **기록 페이지 연동**: 위젯에서 특정 티어를 클릭하면 해당 티어의 전투 기록만 필터링된 화면으로 즉시 이동합니다.
* **개인화 설정**: 사용자가 보고 싶은 티어 범위(Min/Max)를 직접 설정하고 저장할 수 있습니다.

### 3. 고도화된 전투 기록 보관소 (`HistoryPage`)

* **스마트 필터링**: 토너먼트 기록만 보기, 메모가 있는 기록만 보기 등 다각도 필터링을 지원합니다.
* **데이터 요약**: 월별로 데이터를 그룹화하여 해당 월의 총 획득 자원과 게임 횟수를 요약 제공합니다.

### 4. 자동화된 배포 파이프라인 (`Jenkinsfile`)

* **선택적 빌드**: 코드 변경 사항이 있는 서비스(Front/Back/Docker)만 식별하여 빌드 시간을 단축합니다.
* **무중단 배포**: 빌드 성공 시 CloudFront 캐시 무효화 및 헬스 체크를 자동으로 수행하여 안정적인 서비스를 유지합니다.

### 5. 다국어 게임 데이터 파싱 시스템

* **언어 자동 감지**: 한글과 영문 리포트를 자동으로 구분하여 처리합니다.
* **단위 변환 엔진**: 게임 내 표기법(1.5K, 2.3M, 5.7B 등)을 정확한 숫자로 변환합니다.
* **데이터 정규화**: 다양한 형식의 입력 데이터를 통일된 DB 스키마로 변환합니다.

### 6. Primary/Replica 데이터베이스 아키텍처

* **읽기/쓰기 분리**: 
  - **Primary (1 OCPU / 6GB RAM)**: 데이터 쓰기 및 리스트 조회 전담
  - **Replica (1 OCPU / 1GB RAM)**: 무거운 JSON 상세 데이터 조회 전담
* **성능 최적화**: 
  - 커넥션 풀링 (pool_size: 3~5, max_overflow: 8~12)
  - 인덱싱 전략 (`idx_owner_date`)
  - 쿼리 최적화 (WITH절, 윈도우 함수 활용)
* **부하 분산**: 고성능 서버는 빠른 응답이 필요한 작업에, 저성능 서버는 상세 조회에 할당하여 비용 대비 효율 극대화

### 7. 실시간 최고 기록 갱신 시스템

* **자동 갱신**: 사용자가 전투 기록을 업로드할 때마다 티어별 서버 최고 기록을 자동으로 비교 및 갱신합니다.
* **트랜잭션 안전성**: 메인 기록 저장과 독립적으로 처리되어 실패 시에도 영향을 주지 않습니다.
* **개인 기록 추적**: 서버 기록과 별도로 개인 최고 기록도 함께 관리합니다.

### 8. 스케줄러 기반 자동화 시스템

* **월간 통계 리포트**: 
  - 매월 1일 09:00 KST에 자동 실행
  - 전월 유저 증가율, 전투 기록 수 집계
  - Slack으로 자동 알림 발송
* **유령 계정 탐지**:
  - 매월 1일 09:05 KST에 자동 실행
  - 데이터가 없는 계정 자동 식별
  - 서버 용량 관리를 위한 정리 대상 제안
* **멀티 워커 안전성**: 파일 잠금(fcntl)을 통해 여러 워커 환경에서도 스케줄러가 중복 실행되지 않도록 보장