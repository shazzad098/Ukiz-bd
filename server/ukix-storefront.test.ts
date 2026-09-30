import { describe, expect, it } from "vitest";
import { money, products } from "../client/src/pages/Home";

describe("UKIX-BD storefront catalogue", () => {
  it("ships a curated catalogue with unique product ids and selectable sizes", () => {
    const ids = products.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(products.length).toBeGreaterThanOrEqual(6);
    expect(products.every((product) => product.sizes.length > 0)).toBe(true);
    expect(products.every((product) => product.price > 0)).toBe(true);
  });

  it("formats prices in Bangladesh taka", () => {
    expect(money(1850)).toBe("৳1,850");
    expect(money(3000)).toBe("৳3,000");
  });
});
