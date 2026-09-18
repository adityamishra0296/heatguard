# syntax=docker/dockerfile:1

# HeatGuard web app (Next.js).
#
# Multi-stage build. The runtime image seeds a shared SQLite volume on first
# boot (via the entrypoint) and serves the production build. The prediction
# service is optional; the app degrades gracefully when it is unavailable.

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# A build-time datasource so `prisma generate` (run by npm's postinstall) and
# `next build` have a value. No database is touched at build time — all data
# pages are dynamic. The runtime stage overrides this to the shared volume.
ENV DATABASE_URL="file:/app/prisma/build.db"

# --- deps: install all dependencies (dev deps are needed to build & seed) ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# --- build: generate the Prisma client and compile the app ---
FROM deps AS build
COPY . .
RUN npm run db:generate && npm run build

# --- runtime ---
FROM base AS runtime
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"
ENV ML_SERVICE_URL="http://ml-service:8000"
ENV PORT=3000

COPY --from=build /app ./
COPY docker/web-entrypoint.sh /usr/local/bin/web-entrypoint.sh
RUN chmod +x /usr/local/bin/web-entrypoint.sh && mkdir -p /data

EXPOSE 3000
# The entrypoint seeds the shared /data volume on first run, then runs CMD.
ENTRYPOINT ["/usr/local/bin/web-entrypoint.sh"]
CMD ["npm", "run", "start"]
