#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4173}"
BASE_URL="http://127.0.0.1:${PORT}"
LOG_FILE="${TMPDIR:-/tmp}/ukiz-runtime-smoke.log"
HEALTH_FILE="${TMPDIR:-/tmp}/ukiz-runtime-health.json"
HTML_FILE="${TMPDIR:-/tmp}/ukiz-runtime-collection.html"
CALLBACK_FILE="${TMPDIR:-/tmp}/ukiz-runtime-callback.html"
API_FILE="${TMPDIR:-/tmp}/ukiz-runtime-products.json"
DEALS_FILE="${TMPDIR:-/tmp}/ukiz-runtime-deals.json"
SITEMAP_FILE="${TMPDIR:-/tmp}/ukiz-runtime-sitemap.xml"

cd "$ROOT"
# Isolate this check from any developer .env so it verifies the no-fake-data
# behavior for an unconfigured storefront instead of depending on local records.
NODE_ENV=smoke DATABASE_URL= SUPABASE_URL= SUPABASE_ANON_KEY= PORT="$PORT" node dist/index.js >"$LOG_FILE" 2>&1 &
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

curl --silent --show-error --fail "$BASE_URL/collection" -o "$HTML_FILE"
grep --quiet 'id="root"' "$HTML_FILE"
curl --silent --show-error --fail "$BASE_URL/auth/callback" -o "$CALLBACK_FILE"
grep --quiet 'id="root"' "$CALLBACK_FILE"
curl --silent --show-error --fail "$BASE_URL/api/trpc/products.list" -o "$API_FILE"
curl --silent --show-error --fail "$BASE_URL/api/trpc/coupons.activeDeals" -o "$DEALS_FILE"
curl --silent --show-error --fail "$BASE_URL/sitemap.xml" -o "$SITEMAP_FILE"

python3 - "$HEALTH_FILE" "$API_FILE" "$DEALS_FILE" "$SITEMAP_FILE" <<'PY'
import json
import sys
import xml.etree.ElementTree as ET

with open(sys.argv[1], encoding="utf-8") as file:
    health = json.load(file)
assert health.get("ok") is True, f"health endpoint is not healthy: {health}"
with open(sys.argv[2], encoding="utf-8") as file:
    products_response = json.load(file)
products_data = products_response.get("result", {}).get("data", {})
products = products_data.get("json") if isinstance(products_data, dict) else None
assert isinstance(products, list), f"products.list did not return a list: {products_response}"
assert products == [], f"unconfigured storefront exposed non-database product data: {products}"
with open(sys.argv[3], encoding="utf-8") as file:
    deals_response = json.load(file)
deals_data = deals_response.get("result", {}).get("data", {})
deals = deals_data.get("json") if isinstance(deals_data, dict) else None
assert deals == [], f"unconfigured storefront exposed non-database deal data: {deals}"
root = ET.parse(sys.argv[4]).getroot()
locations = [node.text or "" for node in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
assert not any("/product/" in location for location in locations), f"sitemap contains product URLs without database products: {locations}"
print("Built runtime smoke passed: health ok; Collection and OAuth callback deep links served; no fake products, deals, or product URLs exposed without Supabase data.")
PY
