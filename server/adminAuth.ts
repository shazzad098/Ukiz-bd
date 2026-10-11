import crypto from "node:crypto";
import type { Request, Response } from "express";
import { parse } from "cookie";
import { getCookieSecret } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { verifyPassword as verifyScryptPassword } from "./customerAuth";

export const ADMIN_COOKIE = "ukix_admin_session";

// Credentials come ONLY from the environment — no hardcoded defaults, so a
// leaked source tree never carries a usable login. Supported formats:
//   ADMIN_PASSWORD_HASH=<saltHex>:<hashHex>   (scrypt, recommended)
//   ADMIN_PASSWORD_SHA256=<sha256 hex>         (legacy, supported)
// A production server without both vars fails startup (see validateAdminEnv).
function adminId(): string {
  return process.env.ADMIN_LOGIN_ID?.trim() ?? "";
}
function storedPasswordHash(): string {
  return (
    process.env.ADMIN_PASSWORD_HASH?.trim() ||
    process.env.ADMIN_PASSWORD_SHA256?.trim() ||
    ""
  );
}
export function hasAdminCredentials(): boolean {
  return adminId().length > 0 && storedPasswordHash().length > 0;
}

/** Throws with an actionable message when production lacks admin credentials. */
export function validateAdminEnv(): void {
  if (!hasAdminCredentials()) {
    throw new Error(
      "[Admin] ADMIN_LOGIN_ID and ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD_SHA256) are not set. " +
        "Refusing to start: admin login would be permanently broken. " +
        "Generate a scrypt hash with: node -e \"const c=require('node:crypto');const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync('YOUR_PASSWORD',s,64).toString('hex'))\""
    );
  }
  // Unsalted SHA-256 falls to offline brute force — production must use the
  // scrypt "salt:hash" format. Dev/test keep accepting legacy hashes so old
  // local setups don't break.
  if (process.env.NODE_ENV === "production" && !storedPasswordHash().includes(":")) {
    throw new Error(
      "[Admin] ADMIN_PASSWORD_SHA256 (unsalted SHA-256) is not allowed in production. " +
        "Set ADMIN_PASSWORD_HASH to a scrypt salt:hash value and remove ADMIN_PASSWORD_SHA256."
    );
  }
}

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function sign(payload: string) {
  return crypto.createHmac("sha256", getCookieSecret()).update(payload).digest("hex");
}
function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function issueAdminSession(res: Response, req: Request) {
  const payload = Buffer.from(JSON.stringify({ sub: adminId(), role: "super_admin", exp: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  res.cookie(ADMIN_COOKIE, token, { ...getSessionCookieOptions(req), httpOnly: true, maxAge: 1000 * 60 * 60 * 12 });
}

export function clearAdminSession(res: Response, req: Request) {
  res.clearCookie(ADMIN_COOKIE, { ...getSessionCookieOptions(req) });
}

export function isAdminAuthenticated(req: Request) {
  const raw = req.headers.cookie ? parse(req.headers.cookie)[ADMIN_COOKIE] : undefined;
  if (!raw) return false;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number; role?: string };
    return parsed.role === "super_admin" && typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function validateAdminCredentials(id: string, password: string) {
  const expectedId = adminId();
  const expectedHash = storedPasswordHash();
  // No credentials configured -> nothing can log in (fail closed).
  if (!expectedId || !expectedHash) return false;
  if (!safeEqual(id, expectedId)) return false;
  if (expectedHash.includes(":")) {
    // scrypt "salt:hash" format (same scheme as customer passwords).
    return verifyScryptPassword(password, expectedHash);
  }
  // Legacy bare sha256 hex.
  return safeEqual(digest(password), expectedHash);
}
