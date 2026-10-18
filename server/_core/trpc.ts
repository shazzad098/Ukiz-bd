import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { isAdminAuthenticated } from "../adminAuth";
import { getCustomerSessionId } from "../customerAuth";
import type { TrpcContext } from "./context";
import { clientIp, consumeAttempt } from "./rateLimit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// ---------------------------------------------------------------------------
// Login brute-force protection. One fixed window per (client address,
// submitted identity): throttles both password guessing against one account
// and spraying from one source. Counted before credentials are checked, so
// failed attempts consume the budget too.
// ---------------------------------------------------------------------------

const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX_ATTEMPTS = 8;

export const loginRateLimit = t.middleware(async opts => {
  const { ctx, next } = opts;
  const raw = await opts.getRawInput();
  const input = (raw ?? {}) as { id?: unknown; email?: unknown };
  const identity =
    typeof input.id === "string" ? input.id : typeof input.email === "string" ? input.email : "";
  const key = `login|${clientIp(ctx.req)}|${identity.toLowerCase()}`;
  if (!consumeAttempt(key, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many sign-in attempts. Please wait a few minutes and try again.",
    });
  }
  return next({ ctx });
});

// ---------------------------------------------------------------------------
// Coupon guessing protection. coupons.validate is an unauthenticated oracle:
// without a throttle an attacker could enumerate codes until one pays out.
// Generous on purpose (legit shoppers retry typos), keyed per source IP.
// ---------------------------------------------------------------------------

const COUPON_WINDOW_MS = 15 * 60_000;
const COUPON_MAX_ATTEMPTS = 30;

export const couponThrottle = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!consumeAttempt(`coupon|${clientIp(ctx.req)}`, COUPON_MAX_ATTEMPTS, COUPON_WINDOW_MS)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many coupon attempts. Please wait a few minutes and try again.",
    });
  }
  return next({ ctx });
});

// Contact is intentionally generous for real shoppers, but bounded so the
// notification service cannot be used as an unauthenticated spam relay.
const CONTACT_WINDOW_MS = 15 * 60_000;
const CONTACT_MAX_ATTEMPTS = 5;
export const contactThrottle = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!consumeAttempt(`contact|${clientIp(ctx.req)}`, CONTACT_MAX_ATTEMPTS, CONTACT_WINDOW_MS)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many messages. Please try again later.",
    });
  }
  return next({ ctx });
});

// ---------------------------------------------------------------------------
// Order spam protection. Checkout is authenticated, so the budget is keyed
// per customer account (falling back to IP for safety) — one compromised or
// abusive account cannot flood the order queue.
// ---------------------------------------------------------------------------

const ORDER_WINDOW_MS = 60 * 60_000;
const ORDER_MAX_ATTEMPTS = 10;

export const orderThrottle = t.middleware(async opts => {
  const { ctx, next } = opts;
  const customerId = getCustomerSessionId(ctx.req);
  const key =
    customerId !== null ? `order|customer|${customerId}` : `order|ip|${clientIp(ctx.req)}`;
  if (!consumeAttempt(key, ORDER_MAX_ATTEMPTS, ORDER_WINDOW_MS)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many orders in a short time. Please wait before ordering again.",
    });
  }
  return next({ ctx });
});

// Storefront admin panel: authenticated via the signed admin session cookie
// (see adminAuth.ts). Centralises the check that used to be copy-pasted into
// every admin procedure — one definition, impossible to forget on new routes.
export const adminSessionProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!isAdminAuthenticated(ctx.req)) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin session required." });
    }
    return next({ ctx });
  }),
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
