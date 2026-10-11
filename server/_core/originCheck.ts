import type { NextFunction, Request, Response } from "express";

// CSRF protection for state-changing requests.
//
// Session cookies are `SameSite=None` (required by the OAuth iframe flow), so
// the browser WILL attach them to cross-site POSTs. This guard rejects any
// unsafe-method request whose Origin is neither this host nor an explicitly
// allowed origin. Requests without an Origin header are non-browser clients
// (curl, server-to-server) — they never carry a victim's cookies, so they are
// not a CSRF vector; for those we still honour `Sec-Fetch-Site` as a backstop
// for the rare browser request that omits Origin.
//
// Safe methods (GET/HEAD/OPTIONS) are never blocked: they must stay
// side-effect free by contract (OAuth callback, storage redirects, queries).

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const FORBIDDEN_BODY = { error: "Cross-site request blocked" };

export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(entry => entry.trim().replace(/\/$/, ""))
    .filter(entry => entry.length > 0);
}

export function isAllowedOrigin(origin: string, host: string | undefined, extraAllowed: string[]): boolean {
  try {
    const parsed = new URL(origin);
    // Same-origin: Origin host matches the Host header (covers localhost with
    // any port, reverse-proxied domains, and dev Vite middleware serving both).
    if (host && parsed.host === host) return true;
    return extraAllowed.includes(parsed.origin);
  } catch {
    return false;
  }
}

export function csrfOriginGuard(extraAllowedOrigins: string[] = []) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.headers.origin;
    if (origin) {
      if (isAllowedOrigin(origin, req.headers.host, extraAllowedOrigins)) {
        next();
        return;
      }
      res.status(403).json(FORBIDDEN_BODY);
      return;
    }

    // No Origin header: fall back to Sec-Fetch-Site when the client sent one
    // (browsers set it on all requests; non-browser clients never do).
    const fetchSite = req.headers["sec-fetch-site"];
    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
      res.status(403).json(FORBIDDEN_BODY);
      return;
    }
    next();
  };
}
