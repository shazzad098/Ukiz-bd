# Supabase Google sign-in setup

The storefront keeps its existing password authentication and customer session cookie. Google sign-in uses Supabase Auth to verify the provider identity, then the server creates or loads the matching customer row and issues the same httpOnly UKIZ-BD customer session. Google-only customers have no password hash. Existing password accounts are never silently merged by email: the customer must first sign in with the existing password, then explicitly link the verified Google identity from the account page.

## 1. Configure Supabase Auth

In the Supabase project dashboard:

1. Open **Authentication → Providers → Google**, enable Google, and enter the Google OAuth Web client ID and client secret. Keep those provider credentials in Supabase, not in this repository or browser environment variables.
2. Open **Authentication → URL Configuration** and set the production Site URL to the canonical site origin (currently `https://ukizbd.com`, if that remains the production domain).
3. Add exact redirect URLs to the Supabase allow list:
   - `https://ukizbd.com/auth/callback`
   - `http://localhost:3000/auth/callback` for local development
   - Add a `www` or staging origin only if it is deliberately used and configured in the deployment.

In Google Cloud Console, configure the OAuth consent screen and add the actual app origin under **Authorized JavaScript origins**. Under the Supabase provider's Google OAuth client, add the Supabase callback URI shown in the Supabase dashboard, normally:

`https://<supabase-project-ref>.supabase.co/auth/v1/callback`

Google redirects to Supabase first; Supabase then redirects to the application `/auth/callback` page.

## 2. Configure application runtime/build environment

Set these values in the local ignored `.env` and in the hosting environment:

- `DATABASE_URL`: the Supabase Postgres pooler connection string used by Drizzle.
- `SUPABASE_URL`: the project URL, used by server-side Auth verification and optional Storage.
- `SUPABASE_ANON_KEY`: the public anon/publishable key, used server-side to validate access tokens.
- `VITE_SUPABASE_URL`: the same project URL, exposed to the browser.
- `VITE_SUPABASE_ANON_KEY`: the same public anon/publishable key, exposed to the browser.
- `JWT_SECRET`, `ADMIN_LOGIN_ID`, and `ADMIN_PASSWORD_HASH`: existing required application secrets/configuration.
- `SUPABASE_SERVICE_KEY`: optional, server-only; needed only for admin image uploads to Supabase Storage. Never use it in a `VITE_` variable.

A Supabase anon key is designed to be public, but database access still must be restricted with appropriate Postgres privileges/RLS. The application server validates the Google access token with Supabase before trusting its user ID, provider, or email.

## 3. Apply the customer identity migration

The migrations make the customer password hash nullable, add a unique Supabase user ID, and normalize customer emails with a case-insensitive unique index. They preserve customer/order rows. The email migration deliberately aborts if it finds existing case-insensitive duplicates; review and resolve any such accounts manually rather than merging customer history automatically. Apply migrations against staging/backup first, then the production Supabase database using the repository's migration process (`pnpm db:push`) with the correct `DATABASE_URL`. Do not run migrations against production without a backup and maintenance/change approval.

## 4. Verify

After configuration and migration:

1. Open `/signin` and `/signup`; both should show **Continue with Google**.
2. Complete a Google sign-in using a verified email. The callback should return the user to the saved local path, and `/account` should show the customer session.
3. Check that an existing password account with the same email is not silently merged. Sign into it with the password, use **Connect Google account** from `/account`, and confirm the account's Google-linked state appears after redirect.
4. Confirm an active admin coupon appears in the homepage offers section and disappears after deactivation/expiry (the public list refreshes every 15 seconds).
5. Confirm **Admin → Settings → Database** shows **Supabase live**. With no database configured, the storefront remains empty and business writes are disabled instead of appearing successful in volatile memory.
