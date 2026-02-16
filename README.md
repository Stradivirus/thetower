# 🏰 The Tower Analysis Project

본 프로젝트는 게임 'The Tower'의 전투 데이터를 수집하고, 고급 차트 및 인터랙티브 위젯을 통해 사용자 성장을 다각도로 분석하는 통합 웹 솔루션입니다.

## 🛠 기술 스택 (Tech Stack)

### 💻 Frontend
* **Core**: React 18, TypeScript, Vite
* **State & Routing**: Context API, React Router v6
* **Visualization**: Recharts (Interactive Charts), Lucide Icons
* **Styling**: Tailwind CSS (Responsive Design, Custom Animations)

### ⚙️ Backend & DB
* **Framework**: FastAPI (Python 3.12), Pydantic v2
* **ORM & DB**: SQLAlchemy, PostgreSQL (Primary/Replica 분리 아키텍처)
* **Security**: JWT (OAuth2), bcrypt 해싱, SlowAPI (Rate Limiting)

### 🏗 Infrastructure & DevOps
* **Container**: Docker Compose (Multi-container Orchestration)
* **CI/CD**: Jenkins Pipeline (Git Diff 기반 선택적 빌드 시스템)
* **Web Server**: Caddy (Auto HTTPS, HTTP/3 지원, 리버스 프록시)
* **Cloud**: AWS CloudFront (CDN 캐시 무효화 자동화)

---

## 📂 프로젝트 구조 (Project Structure)

* **`front/src/`**: 기능별 컴포넌트, 전역 상태(Context), 다국어 언어팩, 커스텀 훅
* **`back/`**: API 라우터, DB CRUD, 지능형 데이터 파싱 엔진, 정기 스케줄러
* **`docker/`**: 멀티 스테이지 빌드 Dockerfile 및 웹서버 설정(Caddyfile)

---

## 🌟 주요 기능 명세 (Key Features)

### 1. 대시보드 및 실시간 위젯
* **종합 대시보드**: 최근 자원 획득 흐름, 사망 원인 분석, 주간 딜량 순위 등 핵심 지표 요약
* **티어 레코드 위젯**: 서버 최고 기록과 개인 기록을 실시간 비교하며, 클릭 시 해당 티어 기록으로 즉시 이동

### 2. 고도화된 데이터 분석 (History & Detail)
* **성장 분석 차트**: 이중 Y축을 활용해 자원량(Bar)과 성장률(Line)을 동시 시각화하며 추세선 제공
* **전투 상세 분석**: 주요 딜러 기여도 파이 차트 및 유틸리티/적 처치/봇 스탯의 그리드 레이아웃 분석
* **고급 필터링**: 토너먼트 여부, 메모 유무, 티어별 필터링을 통한 맞춤형 기록 조회

### 3. 게임 시뮬레이터 및 계산기
* **모듈 리롤 시뮬레이터**: 밴(Ban) 기능과 랩(Lab) 효과를 반영한 실시간 확률 기반 비용 시뮬레이션
* **스톤 비용 계산기**: UW 스탯 및 카드 마스터리 업그레이드 비용을 실시간 계산하고 로컬 스토리지와 동기화

### 4. 지능형 백엔드 시스템
* **스마트 파싱 엔진**: 한/영 리포트를 자동 감지하고 복잡한 단위(k, M, B, T 등)를 정밀 숫자로 변환
* **읽기/쓰기 분리 아키텍처**: Primary(CUD/List)와 Replica(Detail JSON) DB 서버 분리로 성능 최적화
* **자동화 스케줄러**: 월간 통계 리포트 생성 및 유령 계정 탐지 결과를 Slack으로 실시간 전송

---

## 🔄 CI/CD 및 배포 자동화 (Jenkins Pipeline)

본 프로젝트는 효율적인 운영을 위해 **스마트 빌드 시스템**을 구축했습니다.

1. **변경 감지**: `git diff`를 통해 `front/`, `back/`, `docker/` 중 실제 수정된 영역만 식별
2. **선택적 빌드**: 변경된 서비스만 Docker 레이어 캐시를 활용해 빌드하며, 병렬 처리를 통해 시간 단축
3. **배포 검증**: 컨테이너 실행 후 헬스 체크를 수행하며, 실패 시 이전 안정 버전으로 자동 롤백
4. **CDN 연동**: 프론트엔드 배포 완료 시 AWS CloudFront 캐시를 자동으로 무효화하여 즉시 반영

---

## ⚡ 성능 및 보안 최적화

* **DB 인덱싱**: 복합 인덱스(`idx_owner_date`) 및 윈도우 함수를 활용한 대량 데이터 실시간 집계
* **네트워크**: 멀티 스테이지 빌드로 이미지 크기를 최소화하고, Caddy를 통해 강력한 보안 헤더 적용
* **UX 최적화**: Lazy Loading, 코드 스플리팅, 다국어(KR/EN) 언어팩 시스템 및 모바일 우선 반응형 디자인

---
*상세한 기술 설계와 API 명세는 [TECHNICAL_DETAIL.md](./TECHNICAL_DETAIL.md)에서 확인하실 수 있습니다.*