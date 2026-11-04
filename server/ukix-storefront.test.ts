process.env.DATABASE_URL = "";

import { describe, expect, it } from "vitest";
import { money } from "../client/src/pages/Home";
import { listProducts } from "./db";

describe("UKIX-BD storefront catalogue", () => {
  it("does not expose a fake catalogue when no database products have been configured", async () => {
    expect(await listProducts()).toEqual([]);
  });

  it("formats prices in Bangladesh taka", () => {
    expect(money(1850)).toBe("৳1,850");
    expect(money(3000)).toBe("৳3,000");
  });
});
