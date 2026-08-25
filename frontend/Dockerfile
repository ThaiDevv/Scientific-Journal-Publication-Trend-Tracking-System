# ============================================
# Dockerfile - Frontend (React + Vite → Nginx)
# Multi-stage build: build React → serve với Nginx
# ============================================

# === Stage 1: Build React app ===
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files trước để cache npm install layer
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build argument cho API URL (truyền lúc docker compose build)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_APP_NAME="Journal Trend Tracker"
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build production bundle
RUN npm run build

# === Stage 2: Serve với Nginx ===
FROM nginx:1.25-alpine

# Xóa default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files từ stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
