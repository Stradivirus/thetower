# 파일명: thetower/docker/frontend.Dockerfile
# 용도: React 프론트엔드 빌드 및 Caddy 웹 서버 실행 환경 설정
# 특징: 멀티 스테이지 빌드를 통해 최종 이미지 크기 최소화 및 Caddy를 통한 정적 파일 서빙

# --- 1단계: 빌드 스테이지 (Node.js) ---
FROM node:20-alpine AS builder
WORKDIR /app/front

# 패키지 매니저 파일 복사 및 의존성 설치
COPY front/package.json front/package-lock.json ./
RUN npm ci

# 소스 코드 전체 복사 및 빌드 수행
COPY front/ .
RUN npm run build

# --- 2단계: 실행 스테이지 (Caddy) ---
FROM caddy:2-alpine

# Caddy 설정 파일 복사
COPY docker/Caddyfile /etc/caddy/Caddyfile

# 빌드 스테이지에서 생성된 정적 파일들을 Caddy 서빙 경로로 복사
COPY --from=builder /app/front/dist /usr/share/caddy/html

# HTTP(80), HTTPS(443), HTTP/3(443/udp) 포트 개방
EXPOSE 80 443 443/udp
