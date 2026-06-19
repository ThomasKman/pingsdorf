# syntax=docker/dockerfile:1.7

# ---------- 1) Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install deps based on lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---------- 2) Runtime stage ----------
FROM nginx:1.27-alpine AS runtime

# Replace the default nginx site config with one that supports SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx listens on 8080 inside the container so it can run as a non-root user
# on platforms (like some NAS setups) that don't grant CAP_NET_BIND_SERVICE.
EXPOSE 8080

# Healthcheck: nginx is alive if it serves the index page.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
