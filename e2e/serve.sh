#!/usr/bin/env bash
# Starts the authenticated dev server used by the e2e suite (fresh local D1) for manual debugging.
#   e2e/serve.sh            # then: E2E_BASE=http://localhost:8789 node e2e/tests/01-...test.mjs
set -e
cd "$(dirname "$0")/.."
PORT=${E2E_PORT:-8789}
STATE=$(mktemp -d)
CONFIG=wrangler.toml; [ -f "$CONFIG" ] || CONFIG=wrangler.toml.example
DB_ID=$(grep -E '^database_id' "$CONFIG" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
DB_NAME=$(grep -E '^database_name' "$CONFIG" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
npx wrangler d1 migrations apply "$DB_NAME" --local --persist-to "$STATE/d1" >/dev/null
echo "serving ./dist on http://localhost:$PORT (signed in as ${E2E_USER_EMAIL:-e2e.teacher@classque.test}, state in $STATE)"
# wrangler exits when stdin closes (e.g. when run as a background task), so keep it open.
tail -f /dev/null | npx wrangler pages dev ./dist --d1 "DB=$DB_ID" --persist-to "$STATE/d1" --port "$PORT" --binding "DEV_USER_EMAIL=${E2E_USER_EMAIL:-e2e.teacher@classque.test}"
