import type { NextFunction, Request, Response } from "express";

// Read live (not from the cached ENV object) so tests and late-set env vars
// behave the same as production boot.

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
  "script-src 'self'",
  // React/Framer set inline styles at runtime; fonts come from Google Fonts.
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
  if (req.protocol === "https") return "https";
  const forwarded = req.headers["x-forwarded-proto"];
  const list = Array.isArray(forwarded) ? forwarded : (forwarded ?? "").split(",");
  return list.some(p => p.trim().toLowerCase() === "https") ? "https" : "http";
}

/** 301 redirect to the canonical https:// URL when serving production over http. */
export function httpsRedirect() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isProduction()) {
      next();
      return;
    }
    if (requestProto(req) !== "https") {
      res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
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
