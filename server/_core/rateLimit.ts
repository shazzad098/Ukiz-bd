// Minimal fixed-window in-memory rate limiter for authentication endpoints.
// Single-process only — adequate for this one-node Express server; swap for a
// Redis-backed store if the app ever runs multiple instances.

import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
// Safety valve so a flood of unique keys (e.g. spoofed identities) cannot
// grow memory without bound: prune expired buckets, drop oldest if still huge.
const MAX_BUCKETS = 50_000;

/**
 * Record one attempt against `key`. Returns false when the caller has exceeded
 * `max` attempts within `windowMs` (the window is not extended on rejection —
 * the caller must wait until `resetAt` passes).
 */
export function consumeAttempt(key: string, max: number, windowMs: number, now: number = Date.now()): boolean {
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;

  if (buckets.size > MAX_BUCKETS) {
    buckets.forEach((bucket, k) => {
      if (bucket.resetAt <= now) buckets.delete(k);
    });
    if (buckets.size > MAX_BUCKETS) {
      // Still oversized: hard-trim insertion order (Map preserves it).
      const excess = buckets.size - MAX_BUCKETS;
      let removed = 0;
      buckets.forEach((_bucket, k) => {
        if (removed >= excess) return;
        buckets.delete(k);
        removed += 1;
      });
    }
  }
  return true;
}

/** Test helper: forget all state. */
export function resetAttempts(): void {
  buckets.clear();
}

/** Best-effort client IP behind the (trusted) proxy, else the socket address. */
export function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Blunt Express-level throttle for a path prefix (scraping / accidental
 * hot-loops). Returns 429 JSON — placed before body parsing so rejected
 * requests never touch parsers or route handlers.
 */
export function ipThrottle(prefix: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!consumeAttempt(`${prefix}|${clientIp(req)}`, max, windowMs)) {
      res.status(429).json({ error: "Too many requests. Please slow down." });
      return;
    }
    next();
  };
}
