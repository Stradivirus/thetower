FROM node:20-alpine AS builder
WORKDIR /app/front

COPY front/package.json front/package-lock.json ./
RUN npm ci

COPY front/ .
RUN npm run build

FROM caddy:2-alpine

RUN mkdir -p /data/caddy

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/front/dist /usr/share/caddy/html

EXPOSE 80 443 443/udp
