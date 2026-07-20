#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> SubscriptionHub local setup"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found; using npx pnpm@9.15.0"
  PNPM="npx pnpm@9.15.0"
else
  PNPM="pnpm"
fi

$PNPM install
$PNPM --filter @subscriptionhub/shared build

if command -v docker >/dev/null 2>&1; then
  echo "==> Starting Postgres + Redis + Mailpit"
  docker compose up -d postgres redis mailpit || echo "Docker unavailable; start Postgres/Redis manually"
else
  echo "Docker not found; ensure Postgres (5432) and Redis (6379) are running"
fi

cp -n apps/api/.env.example apps/api/.env 2>/dev/null || true
cp -n apps/web/.env.example apps/web/.env.local 2>/dev/null || true

echo "==> Prisma generate + migrate + seed"
$PNPM --filter @subscriptionhub/api exec prisma generate
$PNPM --filter @subscriptionhub/api exec prisma migrate deploy
$PNPM --filter @subscriptionhub/api db:seed

echo ""
echo "Ready."
echo "  API:  $PNPM --filter @subscriptionhub/api dev"
echo "  Web:  $PNPM --filter @subscriptionhub/web dev"
echo "  Demo: demo@subscriptionhub.local / Demo1234!"
echo "  Docs: http://localhost:4000/api/docs"
