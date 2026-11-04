import { describe, expect, it } from "vitest";
import { recommendScent, type ScentCandidate } from "./scent-matcher";

const scents: ScentCandidate[] = [
  { id: "day", family: "Fresh / Clean", vibe: "Fresh", type: "EDT", notes: "Citrus · White musk · Linen" },
  { id: "night", family: "Amber / Spicy", vibe: "Magnetic", type: "Parfum", notes: "Oud · Vanilla · Incense" },
  { id: "bright-night", family: "Fresh / Amber", vibe: "Fresh", type: "Parfum", notes: "Bergamot · Amber · Vanilla" },
  { id: "grounded", family: "Woody / Earthy", vibe: "Grounded", type: "EDP", notes: "Sandalwood · Vetiver · Moss" },
];

describe("recommendScent", () => {
  it("matches fresh daytime, skin-close answers to a light clean composition", () => {
    expect(recommendScent(scents, { mood: "Fresh", moment: "Everyday", intensity: "Skin-close" })?.id).toBe("day");
  });

  it("uses occasion and intensity to change the recommendation even when mood stays the same", () => {
    expect(recommendScent(scents, { mood: "Fresh", moment: "After dark", intensity: "Let it linger" })?.id).toBe("night");
  });

  it("matches grounded preferences with woody and earthy notes", () => {
    expect(recommendScent(scents, { mood: "Grounded", moment: "Slow mornings", intensity: "A quiet trail" })?.id).toBe("grounded");
  });

  it("returns no result for an empty catalogue", () => {
    expect(recommendScent([], { mood: "Fresh" })).toBeUndefined();
  });
});
