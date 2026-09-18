#!/bin/sh
# Seed the shared SQLite volume on first boot, then hand off to the given command
# (by default `npm run start`). Idempotent: seeding only runs when the database
# file is absent, so restarts reuse the existing data.
set -e

DB_FILE="${DATABASE_URL#file:}"

if [ ! -f "$DB_FILE" ]; then
  echo "[entrypoint] No database at ${DB_FILE} — applying migrations and seeding…"
  npx prisma migrate deploy
  npm run db:seed
  echo "[entrypoint] Seed complete."
else
  echo "[entrypoint] Using existing database at ${DB_FILE}."
fi

exec "$@"
