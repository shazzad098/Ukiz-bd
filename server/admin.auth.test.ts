import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin authentication", () => {
  it("accepts the configured admin credentials and sets a session cookie", async () => {
    const cookies: Array<{ name: string; value: string }> = [];
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        cookie: (name: string, value: string) => cookies.push({ name, value }),
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.login({ id: "arafat5890", password: "@rAfaT_?#1" });
    expect(result).toEqual({ success: true, role: "super_admin" });
    expect(cookies[0]?.name).toBe("ukix_admin_session");
    expect(cookies[0]?.value.split(".")).toHaveLength(2);
  });

  it("rejects an invalid password", async () => {
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.login({ id: "arafat5890", password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
