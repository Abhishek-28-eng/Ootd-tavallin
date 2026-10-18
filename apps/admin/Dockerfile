# ─── Stage 1: Build Admin Dashboard ──────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root manifests
COPY package.json package-lock.json ./

# Copy package manifests
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/

# Install all deps
RUN npm ci --ignore-scripts

# Copy source files
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/
COPY tsconfig.base.json ./

# Build
WORKDIR /app/apps/admin
RUN npm run build

# ─── Stage 2: Serve via Nginx ────────────────────────────────
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
