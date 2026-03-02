# ── Stage 1: install all dependencies ────────────────────────────────────────
FROM node:20-alpine AS deps

# Native build tools for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: build the Next.js app ───────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/data/wedding.db

# Re-install production deps so better-sqlite3 native binary matches runtime
COPY package*.json ./
RUN npm ci --omit=dev

# Standalone Next.js server (outputs to /app/server.js)
COPY --from=builder /app/.next/standalone ./

# Static assets and public files (required alongside standalone server)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public       ./public

# DB initialiser and startup script
COPY init-db.js    ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Data directory (overridden by the volume mount at runtime)
RUN mkdir -p /data

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
