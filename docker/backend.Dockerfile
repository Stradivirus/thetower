# 파일명: thetower/docker/backend.Dockerfile
# 용도: FastAPI 백엔드 애플리케이션 빌드 및 실행 환경 설정
# 특징: Python 3.12 slim 이미지를 기반으로 경량화된 컨테이너 구성

FROM python:3.12-slim

# 파이썬 출력 버퍼링 비활성화 (로그가 즉시 출력되도록 설정)
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

WORKDIR $APP_HOME

# 의존성 파일 복사 및 설치 (캐시 최적화를 위해 먼저 수행)
COPY back/requirements.txt $APP_HOME/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 소스 코드 복사
COPY back/ $APP_HOME/back/

WORKDIR $APP_HOME/back

# Gunicorn을 사용하여 FastAPI 애플리케이션 실행
# - workers 4: 동시 요청 처리를 위한 워커 수 설정
# - uvicorn.workers.UvicornWorker: ASGI 지원을 위한 워커 클래스 사용
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--max-requests", "1000", "--max-requests-jitter", "100", "--bind", "0.0.0.0:8000"]