import { describe, expect, it } from "vitest";
import { stockForSize } from "./products";

describe("stockForSize", () => {
  it("uses size-specific stock when present, including a real zero", () => {
    expect(stockForSize({ sizeStocks: { "10ml": 0, "30ml": 4 }, stock: 20 }, "10ml")).toBe(0);
    expect(stockForSize({ sizeStocks: { "10ml": 0, "30ml": 4 }, stock: 20 }, "30ml")).toBe(4);
  });

  it("falls back to aggregate stock for legacy products without size stock", () => {
    expect(stockForSize({ stock: 3 }, "10ml")).toBe(3);
    expect(stockForSize({ stock: 0 }, "10ml")).toBe(0);
    expect(stockForSize({}, "10ml")).toBeUndefined();
  });

  it("never reports a negative quantity", () => {
    expect(stockForSize({ sizeStocks: { "10ml": -2 }, stock: 5 }, "10ml")).toBe(0);
  });
});
