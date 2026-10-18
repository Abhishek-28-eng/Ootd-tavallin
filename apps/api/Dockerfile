# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

# Install build tools for native addons (argon2, etc.)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace root manifests
COPY package.json package-lock.json ./

# Copy all workspace package.json files
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including dev for build & compiling native addons)
RUN npm ci

# Copy shared package source
COPY packages/ ./packages/

# Copy root tsconfig
COPY tsconfig.base.json ./

# Build shared package first (required for @tavallin/shared types & dist)
WORKDIR /app
RUN npm run build --workspace=@tavallin/shared

# Copy API source
COPY apps/api/ ./apps/api/

# Build the API
WORKDIR /app/apps/api
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init and build tools for native addons
RUN apk add --no-cache dumb-init python3 make g++

WORKDIR /app

# Copy workspace root manifests
COPY package.json package-lock.json ./

# Copy package manifests & compiled shared package from builder
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages

# Install only production dependencies (compiling native addons, then clean build tools)
RUN npm ci --omit=dev && apk del python3 make g++

# Copy compiled output from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy sequelize config and migration files (needed for migrate command)
COPY apps/api/.sequelizerc ./apps/api/
COPY apps/api/.sequelizerc.js ./apps/api/
COPY apps/api/src/database/migrations ./apps/api/src/database/migrations
COPY apps/api/src/database/seeders ./apps/api/src/database/seeders

# Create uploads directory
RUN mkdir -p /app/apps/api/uploads

WORKDIR /app/apps/api

# Copy and set up entrypoint script
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["/docker-entrypoint.sh"]
