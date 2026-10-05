#!/usr/bin/env bash
# ClassQue e2e runner.
#   e2e/run.sh                 run every e2e/tests/*.test.mjs
#   e2e/run.sh 04 05           run only files whose name contains 04 or 05
#   SKIP_BUILD=1 e2e/run.sh    reuse the existing dist/
# Each test file gets a FRESH local D1 (migrations + demo seed) and its own wrangler Pages dev server
# with SYNC_TOKEN=e2e-token. A file whose first line is "// e2e: no-token" runs against a server with
# NO SYNC_TOKEN configured (to test the fail-closed behaviour).
set -u
cd "$(dirname "$0")/.."
ROOT=$PWD
PORT=${E2E_PORT:-8789}
TOKEN=${E2E_TOKEN:-e2e-token}
STATE=$(mktemp -d)
LOG="$STATE/server.log"
CONFIG=wrangler.toml; [ -f "$CONFIG" ] || CONFIG=wrangler.toml.example
DB_ID=$(grep -E '^database_id' "$CONFIG" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
DB_NAME=$(grep -E '^database_name' "$CONFIG" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
SERVER_PID=""

stop_server() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null && wait "$SERVER_PID" 2>/dev/null
  pkill -P "${SERVER_PID:-0}" 2>/dev/null
  SERVER_PID=""
  pkill -f "workerd.*$PORT" 2>/dev/null
  true
}
trap 'stop_server; rm -rf "$STATE"' EXIT

if [ -z "${SKIP_BUILD:-}" ]; then
  echo "== build"; npm run build >/dev/null 2>&1 || { echo "build failed"; npm run build; exit 1; }
fi

start_server() { # $1 = with|without token
  stop_server
  rm -rf "$STATE/d1"
  npx wrangler d1 migrations apply "$DB_NAME" --local --persist-to "$STATE/d1" >/dev/null 2>&1 || { echo "migrations failed"; exit 1; }
  local extra=()
  [ "$1" = "with" ] && extra=(--binding "SYNC_TOKEN=$TOKEN")
  npx wrangler pages dev ./dist --d1 "DB=$DB_ID" --persist-to "$STATE/d1" --port "$PORT" "${extra[@]}" >"$LOG" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 60); do
    curl -s -o /dev/null "http://localhost:$PORT/" && return 0
    sleep 1
  done
  echo "server did not start"; tail -20 "$LOG"; exit 1
}

FILTERS=("$@")
FAILED=()
for f in e2e/tests/*.test.mjs; do
  name=$(basename "$f")
  if [ ${#FILTERS[@]} -gt 0 ]; then
    match=0; for k in "${FILTERS[@]}"; do [[ "$name" == *"$k"* ]] && match=1; done
    [ $match -eq 1 ] || continue
  fi
  mode=with; head -1 "$f" | grep -q "e2e: no-token" && mode=without
  echo; echo "== $name ($mode token)"
  start_server $mode
  E2E_BASE="http://localhost:$PORT" E2E_TOKEN="$TOKEN" node "$f" || FAILED+=("$name")
done
stop_server
echo
if [ ${#FAILED[@]} -gt 0 ]; then echo "FAILED FILES: ${FAILED[*]}"; exit 1; fi
echo "ALL E2E FILES PASSED"
