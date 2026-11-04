# Production readiness: UKIZ-BD storefront

## Changes in this update

The storefront now has a consistent responsive shell, readable hierarchy, accessible navigation/search, catalogue loading and retry states, working route-aware shop search, and clearer product detail controls. Product favorites persist across routes and reloads on the current device; guest cart additions work without forcing sign-in. Cart rows distinguish size/premium variants, respect stock limits, and use stable keys. Scent recommendations now use mood, occasion, and intensity. The unimplemented newsletter success interaction was removed rather than presenting a false confirmation.

The update also fixes product fallback IDs that could not be ordered, adds dynamic product URLs to the sitemap, hardens canonical HTTPS redirects and rate-limit IP extraction, handles malformed signed webhook payloads with a controlled response, and adds unit/runtime/migration checks to CI.

## Verification

The local verification run completed with:

- `pnpm check` — passed.
- `pnpm lint` — passed with zero warnings.
- `pnpm test` — 55 tests passed.
- `pnpm build` — passed.
- `scripts/runtime-smoke.sh` — passed against the built server; it checks `/healthz`, SPA deep-link serving, the catalogue API, and product URLs in the sitemap.

CI additionally runs Drizzle migrations against a disposable PostgreSQL service. The runtime smoke uses test mode and does not replace a live credential/database/deployment check.

## Still required before a live launch

1. **Payment safety is not release-ready.** bKash webhook persistence still needs an atomic, idempotent payment/order transition and duplicate-delivery regression tests. A reconciliation/expiry process is also needed so abandoned online checkouts do not hold inventory indefinitely; late payment success must not fulfill an order after its inventory has been released. Do not enable live bKash until these are implemented and validated against the provider sandbox.
2. **Production secrets and services must be supplied.** Set the real Supabase `DATABASE_URL`, `JWT_SECRET`, `ADMIN_LOGIN_ID`, a scrypt `ADMIN_PASSWORD_HASH`, and canonical `PUBLIC_APP_URL` per `.env.example`. The server deliberately refuses production startup when required database/session/admin configuration is missing. bKash credentials are optional; if omitted, checkout remains COD-only.
3. **Verify domain and hosting.** The configured public hostname `ukizbd.com` failed DNS resolution from this session (`ERR_NAME_NOT_RESOLVED`). Confirm DNS records, HTTPS/TLS termination, proxy topology, and the correct canonical origin before launch.
4. **Route-specific share metadata remains a follow-up.** The sitemap is live-catalogue-aware, but the first HTML response for product/shop routes still starts from the common SPA document. Add server-rendered or prerendered route metadata and product structured data for reliable social previews and crawler indexing.

This work improves the storefront and its safeguards, but the items above mean the repository should not yet be described as fully production-ready for live online payments.
