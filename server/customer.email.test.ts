process.env.DATABASE_URL = "";

import { describe, expect, it } from "vitest";
import { createCustomer, getCustomerByEmail, getCustomerBySupabaseUserId, linkCustomerSupabaseUserId } from "./db";

describe("customer email normalization", () => {
  it("normalizes new email addresses and finds them case-insensitively", async () => {
    const email = `Legacy-${Date.now()}@Example.COM`;
    const created = await createCustomer({ name: "Test Customer", email, passwordHash: "test-only-hash" });
    expect(created.email).toBe(email.trim().toLowerCase());

    const found = await getCustomerByEmail(email.toUpperCase());
    expect(found?.id).toBe(created.id);
  });

  it("links a Google subject to the authenticated customer record", async () => {
    const created = await createCustomer({
      name: "Link Test Customer",
      email: `link-${Date.now()}@example.com`,
      passwordHash: "test-only-hash",
    });
    const subject = `google-subject-${Date.now()}`;
    await linkCustomerSupabaseUserId(created.id, subject);
    expect((await getCustomerBySupabaseUserId(subject))?.id).toBe(created.id);
  });
});
