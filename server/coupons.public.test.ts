process.env.DATABASE_URL = "";

import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { createCoupon } from "./db";
import type { TrpcContext } from "./_core/context";

function publicContext(): TrpcContext {
  return {
    req: {
      protocol: "http",
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: { cookie: () => undefined, clearCookie: () => undefined } as unknown as TrpcContext["res"],
    user: null,
  };
}

beforeAll(async () => {
  await createCoupon({ code: "LIVE10", type: "percent", value: 10, minSubtotal: 500, expiresAt: new Date(Date.now() + 86_400_000), active: "yes" });
  await createCoupon({ code: "EXPIRED10", type: "percent", value: 10, minSubtotal: 0, expiresAt: new Date(Date.now() - 86_400_000), active: "yes" });
  await createCoupon({ code: "DISABLED10", type: "percent", value: 10, minSubtotal: 0, expiresAt: null, active: "no" });
});

describe("public admin-managed deals", () => {
  it("returns only enabled, unexpired coupon data", async () => {
    const deals = await appRouter.createCaller(publicContext()).coupons.activeDeals();
    expect(deals).toHaveLength(1);
    expect(deals[0]).toMatchObject({ code: "LIVE10", type: "percent", value: 10, minSubtotal: 500 });
  });
});
