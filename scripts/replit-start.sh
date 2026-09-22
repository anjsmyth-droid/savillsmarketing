#!/usr/bin/env bash
# One-command startup for Replit. Safe to click "Run" repeatedly:
# - installs deps only if node_modules is missing
# - creates .env from the template only if it doesn't already exist
# - creates and migrates the local SQLite database only if it doesn't exist
# - seeds dummy data only the first time (never re-seeds on later runs,
#   so clicking Run again doesn't create duplicate users/requests)
set -euo pipefail
cd "$(dirname "$0")/.."

# .env must exist BEFORE `npm install`, because installing triggers
# Prisma's postinstall client generation, which needs DATABASE_URL
# resolvable at that point — otherwise the generated client fails to
# find it later at seed/runtime even though .env exists by then.
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only, may take a minute)..."
  npm install
fi

if [ ! -f prisma/dev.db ]; then
  echo "Setting up the database..."
  npx prisma generate
  npx prisma migrate deploy
  echo "Seeding dummy data..."
  npm run db:seed
fi

PORT="${PORT:-3000}"
echo "Starting Marketing Hub on port ${PORT}..."
exec npx next dev -p "${PORT}" -H 0.0.0.0
