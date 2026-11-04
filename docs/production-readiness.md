# Production readiness: UKIZ-BD storefront

## Changes in this update

- Consolidated public product browsing into the single `/collection` route. The old `/shop` URL remains only as a compatibility redirect.
- Removed seeded/fallback products and default catalogue fixtures from customer-facing code. Homepage, collection, product details, and sitemap now use the live database catalogue. With no database configured, product and deal lists stay empty and business writes are disabled rather than appearing to succeed in volatile memory.
- Public deal cards come only from active, unexpired admin coupons. Product, settings, and deal queries refresh so admin changes appear on customer pages without a manual page reload.
- Added Google sign-in/sign-up UI using Supabase Auth PKCE. The callback exchanges the authorization code, the server validates the access token with Supabase, requires a Google identity and confirmed email, then issues the existing secure customer session. Google-only accounts do not get a fake password; existing password accounts can explicitly link Google only after password sign-in.
- Added a production CSP allowance for only the configured HTTPS Supabase Auth origin, lowercased legacy customer emails with a duplicate-safe migration, and enforced case-insensitive customer email uniqueness/lookups.
- Added the additive customer identity migration and setup instructions in [`google-oauth-setup.md`](google-oauth-setup.md).
- Removed the remaining invented 50ml fallback so products without admin-configured size/price options cannot be ordered.

## Verification

The current sandbox validation completed with:

- `pnpm check` — passed.
- `pnpm lint` — passed.
- `pnpm test` — 64 tests passed across 14 files.
- `pnpm build` — passed.
- `scripts/runtime-smoke.sh` — passed against the built server, confirming health, Collection/OAuth callback deep links, and that an unconfigured store exposes no products, deals, or product sitemap URLs.

The customer identity and case-insensitive email migrations were generated and type-checked, but they were **not applied** to a live database in this sandbox. CI applies them to disposable PostgreSQL and runs a mixed-case email lookup smoke.

## Still required before a live launch

1. **Connect a real Supabase project.** No `DATABASE_URL`, Supabase URL/anon key, or browser Auth keys are configured in this sandbox. Add them as protected local/hosting secrets, apply the migration to a staging/backup first, then verify the admin panel reports **Supabase live**. Follow [`google-oauth-setup.md`](google-oauth-setup.md) for the Google provider and redirect allow-list. Do not put the Supabase service-role key in a `VITE_` variable.
2. **Configure production authentication.** Set the real `JWT_SECRET`, `ADMIN_LOGIN_ID`, `ADMIN_PASSWORD_HASH`, and canonical `PUBLIC_APP_URL` in the deployment secret store. The Google button is present in the code, but sign-in cannot complete until the Supabase project, Google provider, and `VITE_SUPABASE_*` build variables are configured.
3. **Payment safety is not release-ready.** bKash webhook persistence still needs an atomic, idempotent payment/order transition and duplicate-delivery regression tests. A reconciliation/expiry process is also needed so abandoned online checkouts do not hold inventory indefinitely; late payment success must not fulfill an order after inventory has been released. Do not enable live bKash until these are implemented and validated against the provider sandbox.
4. **Verify domain and hosting.** The configured public hostname `ukizbd.com` failed DNS resolution from the earlier session. Confirm DNS records, HTTPS/TLS termination, proxy topology, and the correct canonical origin before launch.
5. **Improve crawler/social metadata.** The sitemap is live-catalogue-aware, but product pages still start from the common SPA document. Add server-rendered or prerendered route metadata and product structured data for reliable social previews and crawler indexing.
6. **Scale rate limits with the deployment.** Login, coupon, contact, order, and API limits currently use process-local memory and the server trusts one proxy hop. Keep the deployment single-process behind the verified one-hop proxy, or configure the actual trusted proxy topology and a shared Redis/Upstash limiter before horizontal scaling.

This update makes the storefront data-driven and adds the OAuth integration, but the missing Supabase/Google configuration and the payment/domain release gates mean the project should not yet be described as fully production-ready for live payments.
