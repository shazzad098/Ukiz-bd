import crypto from "node:crypto";
import type { Request, Response } from "express";
import { parse } from "cookie";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";

export const ADMIN_COOKIE = "ukix_admin_session";
const ADMIN_ID = process.env.ADMIN_LOGIN_ID ?? "arafat5890";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_SHA256 ?? "39a2818e496fa51067f916dccb3f62323d3e35da07626890d256b8b7f678aaff";

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function sign(payload: string) {
  return crypto.createHmac("sha256", ENV.cookieSecret || "ukix-admin-local-secret").update(payload).digest("hex");
}
function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function issueAdminSession(res: Response, req: Request) {
  const payload = Buffer.from(JSON.stringify({ sub: ADMIN_ID, role: "super_admin", exp: Date.now() + 1000 * 60 * 60 * 12 })).toString("base64url");
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
  return safeEqual(id, ADMIN_ID) && safeEqual(digest(password), ADMIN_PASSWORD_HASH);
}
