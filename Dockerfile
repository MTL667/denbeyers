# ============================================
# Den Beyers - Production Dockerfile
# Multi-stage build for Nuxt 3 + Prisma
# ============================================

# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache openssl libc6-compat python3 make g++

# Copy package files (not lock file - we need fresh resolution for Linux)
COPY package.json ./
COPY prisma ./prisma/

# Use npm install (not ci) to get correct platform bindings
# This resolves dependencies fresh for Linux Alpine
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build Nuxt application
ENV NITRO_PRESET=node-server
RUN npm run build

# Stage 2: Production (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Copy built application
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nuxtjs

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
