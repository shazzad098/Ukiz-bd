process.env.DATABASE_URL = "";

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function caller() {
  const context: TrpcContext = {
    req: {
      protocol: "http",
      headers: {},
      socket: { remoteAddress: "127.0.0.2" },
    } as unknown as TrpcContext["req"],
    res: { cookie: () => {}, clearCookie: () => {} } as unknown as TrpcContext["res"],
    user: null,
  };
  return appRouter.createCaller(context);
}

describe("enterprise storefront services", () => {
  it("accepts and persists a contact submission even when owner notification is unavailable", async () => {
    const result = await caller().contact.submit({ name: "Test Visitor", email: "visitor@example.com", message: "I need a scent recommendation." });
    expect(result.success).toBe(true);
    expect(result.contactId).toBeTypeOf("number");
  });

  it("records privacy-safe analytics events", async () => {
    const result = await caller().analytics.track({ event: "page_view", path: "/shop", sessionId: "test-session" });
    expect(result.success).toBe(true);
  });

  it("does not advertise online payment without bKash credentials", async () => {
    const result = await caller().payments.status();
    expect(result.bkash).toBe(false);
  });
});
