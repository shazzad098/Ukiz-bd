import { describe, expect, it } from "vitest";
import { cartLineKey } from "./cart";

describe("cartLineKey", () => {
  it("distinguishes standard and premium variants of the same size", () => {
    const standard = cartLineKey({ id: "12", size: "10ml", premium: false });
    const premium = cartLineKey({ id: "12", size: "10ml", premium: true });
    expect(standard).not.toBe(premium);
  });

  it("keeps different sizes on separate cart lines", () => {
    expect(cartLineKey({ id: "12", size: "10ml" })).not.toBe(cartLineKey({ id: "12", size: "30ml" }));
  });
});
