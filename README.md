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

Production fails fast: missing `JWT_SECRET` or admin credentials → process exits instead of serving with forgeable sessions.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Vite + Express dev server |
| `pnpm build` / `pnpm start` | Production build / serve `dist/` |
| `pnpm check` | `tsc --noEmit` |
| `pnpm lint` | ESLint (incl. react-hooks) |
| `pnpm test` | Vitest (auth, CSRF, rate-limit, order pricing) |
| `pnpm db:push` | Drizzle generate + migrate |

Package manager is **pnpm** (`packageManager` field). Do not commit `package-lock.json`.

## Architecture

```
client/src/pages/   Home · Shop · ProductDetails · CommercePages (cart/checkout) · Admin
server/routers.ts   tRPC: products · admin (adminSessionProcedure) · customer · orders · coupons
server/adminAuth.ts scrypt/sha256 credential check + HMAC-signed admin cookie
server/customerAuth.ts scrypt password + HMAC-signed customer cookie
server/_core/       env (fail-fast secrets) · cookies · csrf originCheck · rateLimit · trpc
drizzle/schema.ts   customers · orders (items JSON snapshot) · products · coupons · store_settings
```

Security notes: order prices are recomputed server-side from the catalogue (`resolveOrderItems`); login/signup are rate-limited (8/15min per IP+identity); coupons.validate (30/15min per IP) and orders.create (10/hour per account) carry their own budgets, plus a blunt 600 req/10min per-IP throttle over `/api`; CSRF origin guard blocks cross-site POSTs (cookies are `SameSite=None` for the OAuth iframe flow); JSON body limit is 1MB globally, 10MB on `/api/trpc` for base64 image uploads; image uploads are magic-byte verified (JPEG/PNG/WEBP/GIF); production forces HTTPS (301 + HSTS), sets CSP/nosniff/SAMEORIGIN headers, hides `X-Powered-By`, and refuses unsalted SHA-256 admin passwords (scrypt only). Customer passwords require 8+ characters.

## Admin

- Login: `/admin/login` with `ADMIN_LOGIN_ID` + password.
- Orders support pagination: `admin.orders({ limit, offset })` (default 100).
- City is stored appended to the order address (`"address, city"`).

## SEO

`robots.txt` + `sitemap.xml` in `client/public`, canonical + OG/Twitter + Organization JSON-LD in `client/index.html`.
