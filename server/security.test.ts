import { describe, expect, it } from "vitest";
import { consumeAttempt, ipThrottle, resetAttempts } from "./_core/rateLimit";
import { csrfOriginGuard, isAllowedOrigin, parseAllowedOrigins } from "./_core/originCheck";
import { httpsRedirect, securityHeaders } from "./_core/securityHeaders";
import { sniffImageKind } from "./supabaseStorage";
import { validateAdminEnv } from "./adminAuth";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("login rate limiter (consumeAttempt)", () => {
  it("allows up to max attempts inside the window and then blocks", () => {
    resetAttempts();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(consumeAttempt("key-a", 5, 60_000, now)).toBe(true);
    }
    expect(consumeAttempt("key-a", 5, 60_000, now)).toBe(false);
  });

  it("tracks keys independently and resets after the window", () => {
    resetAttempts();
    const now = 2_000_000;
    expect(consumeAttempt("key-b", 1, 60_000, now)).toBe(true);
    expect(consumeAttempt("key-b", 1, 60_000, now)).toBe(false);
    // Different key is unaffected.
    expect(consumeAttempt("key-c", 1, 60_000, now)).toBe(true);
    // After the window elapses the first key gets a fresh budget.
    expect(consumeAttempt("key-b", 1, 60_000, now + 60_001)).toBe(true);
  });
});

describe("CSRF origin guard", () => {
  type Handler = (req: unknown, res: unknown, next: () => void) => void;

  function run(handler: Handler, options: { method?: string; origin?: string; host?: string; fetchSite?: string }) {
    const events: string[] = [];
    const req = {
      method: options.method ?? "POST",
      headers: {
        ...(options.origin ? { origin: options.origin } : {}),
        ...(options.host ? { host: options.host } : {}),
        ...(options.fetchSite ? { "sec-fetch-site": options.fetchSite } : {}),
      },
    };
    const res = {
      status(code: number) {
        events.push(`status:${code}`);
        return this;
      },
      json(_body: unknown) {
        events.push("json");
        return this;
      },
    };
    handler(req, res, () => events.push("next"));
    return events;
  }

  const guard = csrfOriginGuard(["https://allowed.example"]);

  it("never blocks safe methods", () => {
    expect(run(guard, { method: "GET", origin: "https://evil.example", host: "shop.example" })).toEqual(["next"]);
  });

  it("allows same-origin state-changing requests", () => {
    expect(run(guard, { origin: "https://shop.example", host: "shop.example" })).toEqual(["next"]);
  });

  it("allows explicitly whitelisted origins", () => {
    expect(run(guard, { origin: "https://allowed.example", host: "shop.example" })).toEqual(["next"]);
  });

  it("blocks cross-origin state-changing requests", () => {
    expect(run(guard, { origin: "https://evil.example", host: "shop.example" })).toEqual(["status:403", "json"]);
  });

  it("blocks browser requests without Origin but with cross-site Sec-Fetch-Site", () => {
    expect(run(guard, { host: "shop.example", fetchSite: "cross-site" })).toEqual(["status:403", "json"]);
  });

  it("allows non-browser requests that carry no Origin or Sec-Fetch-Site", () => {
    expect(run(guard, { host: "shop.example" })).toEqual(["next"]);
  });

  it("parses and normalises the ALLOWED_ORIGINS list", () => {
    expect(parseAllowedOrigins("https://a.example, https://b.example/ ,")).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });

  it("compares origins by host including ports", () => {
    expect(isAllowedOrigin("http://localhost:5173", "localhost:5173", [])).toBe(true);
    expect(isAllowedOrigin("http://localhost:5173", "localhost:3000", [])).toBe(false);
    expect(isAllowedOrigin("not-a-url", "localhost:3000", [])).toBe(false);
  });
});

describe("login brute-force throttle", () => {
  it("rejects repeated failed logins with TOO_MANY_REQUESTS", async () => {
    const ctx = {
      user: null,
      req: {
        protocol: "http",
        headers: { "x-forwarded-for": "198.51.100.9" },
        socket: { remoteAddress: "127.0.0.1" },
      },
      res: {},
    } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    // Unique identity per run so repeated test runs never share a bucket.
    const id = `brute-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    for (let attempt = 0; attempt < 8; attempt++) {
      await expect(caller.admin.login({ id, password: "wrong" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    // Ninth attempt within the window is throttled before credentials run.
    await expect(caller.admin.login({ id, password: "wrong" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    // A different identity is unaffected — the throttle is per account/source.
    await expect(caller.admin.login({ id: `${id}-other`, password: "wrong" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("coupon guessing throttle", () => {
  it("throttles repeated coupon validations from one IP", async () => {
    resetAttempts();
    const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
    const ctx = {
      user: null,
      req: {
        protocol: "http",
        headers: { "x-forwarded-for": ip },
        socket: { remoteAddress: "127.0.0.1" },
      },
      res: {},
    } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    for (let i = 0; i < 30; i++) {
      await caller.coupons.validate({ code: `NOPE-${i}`, subtotal: 1000 }).catch(e => e);
    }
    await expect(
      caller.coupons.validate({ code: "NOPE-final", subtotal: 1000 })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});

describe("order spam throttle", () => {
  it("rejects the 11th order within an hour for one account", async () => {
    resetAttempts();
    const ip = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
    const ctx = {
      user: null,
      req: {
        protocol: "http",
        headers: { "x-forwarded-for": ip, cookie: "" },
        socket: { remoteAddress: "127.0.0.1" },
      },
      res: {},
    } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    // No customer session -> fails auth first, but the throttle still counts.
    for (let i = 0; i < 10; i++) {
      await expect(
        caller.orders.create({
          items: [{ productId: "1", name: "x", size: "10ml", price: 1, quantity: 1 }],
          name: "T",
          phone: "01",
          address: "Dhaka",
          zone: "inside",
          paymentMethod: "cod",
        })
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    await expect(
      caller.orders.create({
        items: [{ productId: "1", name: "x", size: "10ml", price: 1, quantity: 1 }],
        name: "T",
        phone: "01",
        address: "Dhaka",
        zone: "inside",
        paymentMethod: "cod",
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});

describe("image magic-byte sniffing", () => {
  it("recognises jpeg, png, webp and gif, rejects the rest", () => {
    expect(sniffImageKind(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe("jpeg");
    expect(
      sniffImageKind(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]))
    ).toBe("png");
    expect(
      sniffImageKind(Buffer.concat([Buffer.from("RIFFxxxxWEBP", "ascii"), Buffer.alloc(4)]))
    ).toBe("webp");
    expect(sniffImageKind(Buffer.from("GIF89a123", "ascii"))).toBe("gif");
    expect(sniffImageKind(Buffer.from("<script>alert(1)</script>", "utf8"))).toBeNull();
    expect(sniffImageKind(Buffer.alloc(0))).toBeNull();
  });
});

describe("production admin password policy", () => {
  it("refuses unsalted SHA-256 in production, accepts scrypt", () => {
    const savedNodeEnv = process.env.NODE_ENV;
    const savedId = process.env.ADMIN_LOGIN_ID;
    const savedHash = process.env.ADMIN_PASSWORD_HASH;
    const savedSha = process.env.ADMIN_PASSWORD_SHA256;
    try {
      process.env.NODE_ENV = "production";
      process.env.ADMIN_LOGIN_ID = "owner";
      delete process.env.ADMIN_PASSWORD_HASH;
      process.env.ADMIN_PASSWORD_SHA256 = "a".repeat(64);
      expect(() => validateAdminEnv()).toThrow(/scrypt/i);
      process.env.ADMIN_PASSWORD_HASH = `${"b".repeat(32)}:${"c".repeat(128)}`;
      expect(() => validateAdminEnv()).not.toThrow();
    } finally {
      process.env.NODE_ENV = savedNodeEnv;
      if (savedId === undefined) delete process.env.ADMIN_LOGIN_ID;
      else process.env.ADMIN_LOGIN_ID = savedId;
      if (savedHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
      else process.env.ADMIN_PASSWORD_HASH = savedHash;
      if (savedSha === undefined) delete process.env.ADMIN_PASSWORD_SHA256;
      else process.env.ADMIN_PASSWORD_SHA256 = savedSha;
    }
  });
});

describe("security headers + global throttle", () => {
  function mockRes() {
    const headers: Record<string, string> = {};
    return {
      headers,
      statusCode: 200,
      body: null as unknown,
      setHeader(k: string, v: string) {
        headers[k] = v;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(b: unknown) {
        this.body = b;
        return this;
      },
      redirect(code: number, _url: string) {
        this.statusCode = code;
        return this;
      },
    };
  }

  it("sets hardening headers on every response", () => {
    const res = mockRes();
    let nextCalled = false;
    securityHeaders()({} as never, res as never, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
    expect(res.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(res.headers["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(res.headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
  });

  it("global IP throttle returns 429 past the budget", () => {
    resetAttempts();
    const mw = ipThrottle(`test-${Date.now()}`, 2, 60_000);
    const req = { headers: {}, socket: { remoteAddress: "10.0.0.9" } };
    let nexts = 0;
    const next = () => {
      nexts += 1;
    };
    mw(req as never, mockRes() as never, next);
    mw(req as never, mockRes() as never, next);
    const res = mockRes();
    mw(req as never, res as never, next);
    expect(nexts).toBe(2);
    expect(res.statusCode).toBe(429);
  });

  it("https redirect only rewrites production http traffic", () => {
    const saved = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const res = mockRes();
      let nexted = false;
      httpsRedirect()(
        { protocol: "http", headers: {}, originalUrl: "/shop" } as never,
        res as never,
        () => {
          nexted = true;
        }
      );
      expect(nexted).toBe(false);
      expect(res.statusCode).toBe(301);
    } finally {
      process.env.NODE_ENV = saved;
    }
  });
});
