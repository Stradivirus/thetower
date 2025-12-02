# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app/front

# Copy package files and install dependencies
# Copying these separately leverages Docker layer caching
COPY front/package.json front/package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source code
COPY front/ .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Caddy
FROM caddy:2-alpine

# Copy the Caddyfile. The build context is the project root.
COPY docker/Caddyfile /etc/caddy/Caddyfile

# Copy the built static files from the builder stage to Caddy's default serve directory
COPY --from=builder /app/front/dist /usr/share/caddy/html

# Expose ports for Caddy to listen on (HTTP, HTTPS, HTTP/3)
EXPOSE 80 443 443/udp
