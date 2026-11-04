import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { googleIdentityFromUser, SupabaseAuthRejectedError } from "./supabaseAuth";

function user(overrides: Partial<User> = {}): User {
  return {
    id: "google-subject-123",
    email: "customer@example.com",
    email_confirmed_at: "2026-01-01T00:00:00.000Z",
    confirmed_at: "2026-01-01T00:00:00.000Z",
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: { full_name: "Fragrance Customer" },
    identities: [{ provider: "google" }],
    ...overrides,
  } as unknown as User;
}

describe("Supabase Google identity verification", () => {
  it("normalizes a verified Google identity and its email for the customer session bridge", () => {
    expect(googleIdentityFromUser(user())).toEqual({
      subject: "google-subject-123",
      email: "customer@example.com",
      name: "Fragrance Customer",
    });
  });

  it("rejects identities from other providers", () => {
    expect(() => googleIdentityFromUser(user({ app_metadata: { provider: "github" }, identities: null }))).toThrow(SupabaseAuthRejectedError);
  });

  it("rejects an unverified email address", () => {
    expect(() => googleIdentityFromUser(user({ email_confirmed_at: null, confirmed_at: null }))).toThrow(SupabaseAuthRejectedError);
  });
});
