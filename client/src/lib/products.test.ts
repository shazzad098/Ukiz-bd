import { describe, expect, it } from "vitest";
import { buildSizePayload, parseSizes, stockForSize } from "./products";

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

describe("catalogue size data", () => {
  it("keeps missing size data empty instead of inventing 50ml", () => {
    expect(parseSizes(null)).toEqual([]);
    expect(parseSizes("[]")).toEqual([]);
  });

  it("rejects saving a product without any real size option", () => {
    expect(() => buildSizePayload([])).toThrow("Add at least one product size");
    expect(() => buildSizePayload([{ size: "  ", price: 0, stock: 0 }])).toThrow("Add at least one product size");
  });
});
