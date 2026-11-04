#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4173}"
BASE_URL="http://127.0.0.1:${PORT}"
LOG_FILE="${TMPDIR:-/tmp}/ukiz-runtime-smoke.log"
HEALTH_FILE="${TMPDIR:-/tmp}/ukiz-runtime-health.json"
HTML_FILE="${TMPDIR:-/tmp}/ukiz-runtime-shop.html"
API_FILE="${TMPDIR:-/tmp}/ukiz-runtime-products.json"
SITEMAP_FILE="${TMPDIR:-/tmp}/ukiz-runtime-sitemap.xml"

cd "$ROOT"
NODE_ENV=smoke PORT="$PORT" node dist/index.js >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 40); do
  if curl --silent --fail "$BASE_URL/healthz" -o "$HEALTH_FILE"; then
    ready=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    cat "$LOG_FILE"
    exit 1
  fi
  sleep 0.25
done
if [[ "$ready" != "1" ]]; then
  cat "$LOG_FILE"
  echo "Built server did not become healthy on port $PORT." >&2
  exit 1
fi

curl --silent --show-error --fail "$BASE_URL/shop" -o "$HTML_FILE"
grep --quiet 'id="root"' "$HTML_FILE"
curl --silent --show-error --fail "$BASE_URL/api/trpc/products.list" -o "$API_FILE"
curl --silent --show-error --fail "$BASE_URL/sitemap.xml" -o "$SITEMAP_FILE"

python3 - "$HEALTH_FILE" "$API_FILE" "$SITEMAP_FILE" <<'PY'
import json
import sys
import xml.etree.ElementTree as ET

with open(sys.argv[1], encoding="utf-8") as file:
    health = json.load(file)
assert health.get("ok") is True, f"health endpoint is not healthy: {health}"
with open(sys.argv[2], encoding="utf-8") as file:
    response = json.load(file)
result = response.get("result", {}).get("data", {})
products = result.get("json") if isinstance(result, dict) else None
assert isinstance(products, list), f"products.list did not return a list: {response}"
assert len(products) > 0, "the built server returned no products"
root = ET.parse(sys.argv[3]).getroot()
locations = [node.text or "" for node in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
assert any("/product/" in location for location in locations), "the sitemap did not include product URLs"
print(f"Built runtime smoke passed: health ok; SPA deep link served; {len(products)} products and dynamic sitemap returned.")
PY
