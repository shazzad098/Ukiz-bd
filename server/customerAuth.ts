import crypto from "node:crypto";
import type { Request, Response } from "express";
import { parse } from "cookie";
import { getCookieSecret } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";

export const CUSTOMER_COOKIE = "ukix_customer_session";
// Long-lived so customers stay logged in across refresh / window close.
// They are logged out only when they explicitly log out (cookie cleared)
// or when the token expires.
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function secret() {
  return getCookieSecret();
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  let derived: string;
  try {
    derived = crypto.scryptSync(password, salt, 64).toString("hex");
  } catch {
    return false;
  }
  return safeEqual(derived, hash);
}

export function issueCustomerSession(res: Response, req: Request, customerId: number) {
  const payload = Buffer.from(
    JSON.stringify({ sub: customerId, role: "customer", exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  res.cookie(CUSTOMER_COOKIE, token, {
    ...getSessionCookieOptions(req),
    httpOnly: true,
    maxAge: SESSION_TTL_MS,
  });
}

export function clearCustomerSession(res: Response, req: Request) {
  res.clearCookie(CUSTOMER_COOKIE, { ...getSessionCookieOptions(req) });
}

export function getCustomerSessionId(req: Request): number | null {
  const raw = req.headers.cookie ? parse(req.headers.cookie)[CUSTOMER_COOKIE] : undefined;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: number;
      role?: string;
      exp?: number;
    };
    if (parsed.role !== "customer" || typeof parsed.sub !== "number" || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= Date.now()) return null;
    return parsed.sub;
  } catch {
    return null;
  }
}
