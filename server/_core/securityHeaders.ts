import type { NextFunction, Request, Response } from "express";

// ---------------------------------------------------------------------------
// Transport + content security headers.
//
// - HSTS + HTTPS redirect are production-only: local dev runs on plain HTTP
//   and must not get poisoned with a cached HSTS policy.
// - CSP is production-only too: Vite dev middleware serves HMR clients with
//   inline/eval scripts that a strict policy would break.
// - frame-ancestors 'self': the OAuth flow is a full-page redirect (see
//   client/src/const.ts), so nothing legitimate embeds this app cross-origin.
// ---------------------------------------------------------------------------

const PROD_CSP = [
  "default-src 'self'",
  // React/Framer set inline styles at runtime; fonts come from Google Fonts.
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https:",
  // Product photos: self-hosted, Supabase public URLs and legacy hotlinks.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function requestProto(req: Request): string {
  // Express resolves this through the app's explicit one-hop trusted proxy
  // configuration; raw X-Forwarded-Proto must never be trusted here directly.
  return req.protocol;
}

export function canonicalOrigin(): string {
  try {
    const configured = new URL(process.env.PUBLIC_APP_URL?.trim() || "https://ukizbd.com");
    if (configured.protocol === "https:" && !configured.username && !configured.password) return configured.origin;
  } catch {
    // Fall back to the storefront's known canonical origin below.
  }
  return "https://ukizbd.com";
}

/** Redirect production HTTP traffic to the configured canonical HTTPS origin. */
export function httpsRedirect() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isProduction()) {
      next();
      return;
    }
    if (requestProto(req) !== "https") {
      res.redirect(301, `${canonicalOrigin()}${req.originalUrl}`);
      return;
    }
    next();
  };
}

export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );
    // OAuth is a full-page redirect, no popup/opener handshake to preserve.
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    if (isProduction()) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
      res.setHeader("Content-Security-Policy", PROD_CSP);
    }
    next();
  };
}
