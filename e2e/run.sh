#!/usr/bin/env bash
# ClassQue e2e runner.
#   e2e/run.sh                 run every e2e/tests/*.test.mjs
#   e2e/run.sh 04 05           run only files whose name contains 04 or 05
#   SKIP_BUILD=1 e2e/run.sh    reuse the existing dist/
# Each test file gets a FRESH local D1 (migrations + demo seed) and its own wrangler Pages dev server
# signed in as a test teacher (DEV_USER_EMAIL). A file whose first line is "// e2e: no-login" runs with NO signed-in
# teacher (to test the fail-closed behaviour). A sibling <name>.seed.sql is applied to the fresh D1 before the server starts.
set -u
cd "$(dirname "$0")/.."
ROOT=$PWD
PORT=${E2E_PORT:-8789}
# Local stand-in for the Cloudflare Access login. LEGACY_OWNER_EMAIL makes this teacher inherit the
# demo data that migration 0002 stores under 'teacher-1' (exactly how the real owner claims their data).
USER_EMAIL=${E2E_USER_EMAIL:-e2e.teacher@classque.test}
STATE=$(mktemp -d)
LOG="$STATE/server.log"
CONFIG=wrangler.toml; [ -f "$CONFIG" ] || CONFIG=wrangler.toml.example
DB_ID=$(grep -E '^database_id' "$CONFIG" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
DB_NAME=$(grep -E '^database_name' "$CONFIG" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
SERVER_PID=""

stop_server() {
  # The server runs in its own process group (setsid below): killing only the npx wrapper leaves wrangler and
  # workerd orphaned, and a long run ends up with dozens of them eating all the memory.
  [ -n "$SERVER_PID" ] && kill -- "-$SERVER_PID" 2>/dev/null; [ -n "$SERVER_PID" ] && wait "$SERVER_PID" 2>/dev/null
  SERVER_PID=""
  pkill -f "workerd.*$PORT" 2>/dev/null
  true
}
trap 'stop_server; rm -rf "$STATE"' EXIT

if [ -z "${SKIP_BUILD:-}" ]; then
  echo "== build"; npm run build >/dev/null 2>&1 || { echo "build failed"; npm run build; exit 1; }
fi

start_server() { # $1 = with|without login, $2 = optional SQL seed file
  stop_server
  rm -rf "$STATE/d1"
  npx wrangler d1 migrations apply "$DB_NAME" --local --persist-to "$STATE/d1" >/dev/null 2>&1 || { echo "migrations failed"; exit 1; }
  if [ -n "${2:-}" ] && [ -f "$2" ]; then
    npx wrangler d1 execute "$DB_NAME" --local --persist-to "$STATE/d1" --file "$2" >/dev/null 2>&1 || { echo "seed $2 failed"; exit 1; }
  fi
  local extra=()
  # "no-login" files run without DEV_USER_EMAIL, i.e. as if Cloudflare Access had not signed anyone in.
  [ "$1" = "with" ] && extra+=(--binding "DEV_USER_EMAIL=$USER_EMAIL" --binding "LEGACY_OWNER_EMAIL=$USER_EMAIL")
  setsid npx wrangler pages dev ./dist --d1 "DB=$DB_ID" --persist-to "$STATE/d1" --port "$PORT" "${extra[@]}" >"$LOG" 2>&1 &
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
  login=with; head -1 "$f" | grep -q "e2e: no-login" && login=without
  echo; echo "== $name ($login login)"
  start_server $login "${f%.test.mjs}.seed.sql"
  E2E_BASE="http://localhost:$PORT" E2E_USER_EMAIL="$USER_EMAIL" E2E_STATE="$STATE" E2E_DB="$DB_NAME" timeout "${E2E_FILE_TIMEOUT:-420}" node "$f" || FAILED+=("$name")
done
stop_server
echo
if [ ${#FAILED[@]} -gt 0 ]; then echo "FAILED FILES: ${FAILED[*]}"; exit 1; fi
echo "ALL E2E FILES PASSED"
