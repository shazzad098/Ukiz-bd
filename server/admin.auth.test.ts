import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { validateAdminCredentials } from "./adminAuth";
import type { TrpcContext } from "./_core/context";

// Test credentials are provisioned HERE, at runtime — never hardcoded in
// source — so a leaked repository never carries a usable admin login.
const TEST_ADMIN_ID = "test-admin";
const TEST_ADMIN_PASSWORD = "test-password-123";
const TEST_ADMIN_SALT = "0123456789abcdef0123456789abcdef";
const TEST_ADMIN_HASH = `${TEST_ADMIN_SALT}:${crypto.scryptSync(TEST_ADMIN_PASSWORD, TEST_ADMIN_SALT, 64).toString("hex")}`;

process.env.ADMIN_LOGIN_ID = TEST_ADMIN_ID;
process.env.ADMIN_PASSWORD_HASH = TEST_ADMIN_HASH;
delete process.env.ADMIN_PASSWORD_SHA256;

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as unknown as TrpcContext["req"],
    res: {} as unknown as TrpcContext["res"],
  };
}

describe("admin authentication", () => {
  it("accepts the configured admin credentials and sets a session cookie", async () => {
    const cookies: Array<{ name: string; value: string }> = [];
    const ctx = {
      ...makeCtx(),
      res: {
        cookie: (name: string, value: string) => cookies.push({ name, value }),
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.login({ id: TEST_ADMIN_ID, password: TEST_ADMIN_PASSWORD });
    expect(result).toEqual({ success: true, role: "super_admin" });
    expect(cookies[0]?.name).toBe("ukix_admin_session");
    expect(cookies[0]?.value.split(".")).toHaveLength(2);
  });

  it("rejects an invalid password", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.login({ id: TEST_ADMIN_ID, password: "wrong-password" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects an unknown admin id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.login({ id: "not-the-admin", password: TEST_ADMIN_PASSWORD })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("fails closed when no credentials are configured", () => {
    const savedId = process.env.ADMIN_LOGIN_ID;
    const savedHash = process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_LOGIN_ID;
    delete process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_PASSWORD_SHA256;
    try {
      expect(validateAdminCredentials("anything", "anything")).toBe(false);
    } finally {
      process.env.ADMIN_LOGIN_ID = savedId;
      process.env.ADMIN_PASSWORD_HASH = savedHash;
    }
  });
});

describe("admin routes require an admin session", () => {
  // Regression net for the adminSessionProcedure middleware: every admin-only
  // route must reject a caller with no session cookie.
  const unauthedRoutes = [
    { name: "admin.orders", run: (c: ReturnType<typeof appRouter.createCaller>) => c.admin.orders() },
    {
      name: "admin.updateOrderStatus",
      run: (c: ReturnType<typeof appRouter.createCaller>) => c.admin.updateOrderStatus({ id: 1, status: "Processing" }),
    },
    { name: "admin.coupons.list", run: (c: ReturnType<typeof appRouter.createCaller>) => c.admin.coupons.list() },
    {
      name: "admin.coupons.remove",
      run: (c: ReturnType<typeof appRouter.createCaller>) => c.admin.coupons.remove({ id: 1 }),
    },
    { name: "admin.settings.get", run: (c: ReturnType<typeof appRouter.createCaller>) => c.admin.settings.get() },
    {
      name: "admin.settings.save",
      run: (c: ReturnType<typeof appRouter.createCaller>) =>
        c.admin.settings.save({
          announcement: "x",
          merchantNumber: "01700000000",
          supportEmail: "a@b.co",
          supportPhone: "",
          freeThreshold: 3000,
        }),
    },
    { name: "customers.list", run: (c: ReturnType<typeof appRouter.createCaller>) => c.customers.list() },
    {
      name: "products.delete",
      run: (c: ReturnType<typeof appRouter.createCaller>) => c.products.delete({ id: 1 }),
    },
  ];

  for (const route of unauthedRoutes) {
    it(`${route.name} rejects a session-less caller`, async () => {
      const caller = appRouter.createCaller(makeCtx());
      await expect(route.run(caller)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  }
});
