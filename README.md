# UKIZ-BD — authentic perfume decants in Bangladesh

Try-before-you-commit storefront + admin control room. React 19 + Express + tRPC + Supabase Postgres (Drizzle).

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in values below
pnpm dev               # http://localhost:3000
```

## Environment

| Var | Required | What it does |
|---|---|---|
| `DATABASE_URL` | dev: no / prod: yes | Supabase pooler Postgres URL (port 6543). Without it the app runs on in-memory seed data. |
| `ADMIN_LOGIN_ID` | prod: yes | Admin panel login ID. |
| `ADMIN_PASSWORD_HASH` | prod: yes | scrypt `salt:hash` — generate: `node -e "const c=require('node:crypto');const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync('YOUR_PASSWORD',s,64).toString('hex'))"`. Legacy `ADMIN_PASSWORD_SHA256` (unsalted sha256 hex) still works but rotate to scrypt. |
| `JWT_SECRET` | prod: yes | 32+ random bytes hex — signs admin + customer cookies. Server refuses to start in production without it. Generate: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` |
| `ALLOWED_ORIGINS` | no | Extra comma-separated origins allowed for cross-site POSTs (CSRF guard). Same-origin always allowed. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | no | Product image uploads. Without them image URLs still work, uploads fail with a clear error. |
| `PORT` | no | Default 3000. |
| `PUBLIC_APP_URL` | bKash only | Public HTTPS origin used for bKash callback URLs. |
| `BKASH_BASE_URL` + `BKASH_USERNAME` + `BKASH_PASSWORD` + `BKASH_APP_KEY` + `BKASH_APP_SECRET` | optional | Enables verified bKash Tokenized Checkout. Leave all blank to offer COD only; never use manual Send Money as a paid status. |

Production fails fast: missing `JWT_SECRET` or admin credentials → process exits instead of serving with forgeable sessions.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Vite + Express dev server |
| `pnpm build` / `pnpm start` | Production build / serve `dist/` |
| `pnpm check` | `tsc --noEmit` |
| `pnpm lint` | ESLint (incl. react-hooks) |
| `pnpm test` | Vitest (auth, CSRF, rate-limit, order pricing and inventory) |
| `pnpm db:push` | Drizzle generate + migrate |

Package manager is **pnpm** (`packageManager` field). Do not commit `package-lock.json`.

## Architecture

```
client/src/pages/   Home · Shop · ProductDetails · CommercePages (cart/checkout) · Admin
server/routers.ts   tRPC: products · admin · customer · orders · coupons · contacts · analytics · payments
server/adminAuth.ts scrypt/sha256 credential check + HMAC-signed admin cookie
server/customerAuth.ts scrypt password + HMAC-signed customer cookie
server/_core/       env (fail-fast secrets) · cookies · csrf originCheck · rateLimit · trpc
drizzle/schema.ts   customers · orders · products · coupons · store_settings · payments · contacts · inventory_events · analytics_events
```

Security notes: order prices are recomputed server-side from the catalogue (`resolveOrderItems`); stock is locked and decremented with the order insert in one database transaction; cancellation releases stock with an audit event; login/signup are rate-limited (8/15min per IP+identity); coupons.validate (30/15min per IP), contact submission and orders.create carry their own budgets, plus a blunt 600 req/10min per-IP throttle over `/api`; CSRF origin guard blocks cross-site POSTs (cookies are `SameSite=None` for the OAuth iframe flow); JSON body limit is 1MB globally, 10MB on `/api/trpc` for base64 image uploads; image uploads are magic-byte verified (JPEG/PNG/WEBP/GIF); production forces HTTPS (301 + HSTS), sets CSP/nosniff/SAMEORIGIN headers, hides `X-Powered-By`, and refuses unsalted SHA-256 admin passwords (scrypt only). Customer passwords require 8+ characters.

## Admin

- Login: `/admin/login` with `ADMIN_LOGIN_ID` + password.
- Orders support pagination: `admin.orders({ limit, offset })` (default 100).
- Inbox: `/admin/contacts` stores contact messages durably and lets staff mark them new, read or resolved.
- Online payment: configure bKash Tokenized Checkout to enable `/api/payments/bkash/callback` and the signed `/api/payments/bkash/webhook`; the app verifies status, amount and currency server-side before marking an order paid.
- City is stored appended to the order address (`"address, city"`).

## SEO

`robots.txt` + `sitemap.xml` + `manus-routes.json` in `client/public`, route-aware canonical/OG/Twitter metadata in `client/src/components/Seo.tsx`, responsive CDN image URLs, and Organization JSON-LD in `client/index.html`.

## Operations

- `GET /healthz` checks database reachability and returns `503` in production when the database is unavailable.
- First-party analytics are stored without customer PII in `analytics_events`; the admin overview shows page views, sessions, checkout starts and client errors.
- Apply migrations with `pnpm db:push` after setting `DATABASE_URL`. The committed SQL migrations are `drizzle/0003_redundant_chamber.sql` and `drizzle/0004_chilly_lila_cheney.sql`.
