import { describe, expect, it } from "vitest";
import { calculateWastePercentage } from "./meal-metrics";

describe("calculateWastePercentage", () => {
  it("returns zero when nothing was prepared", () => {
    expect(calculateWastePercentage(0, 10)).toBe(0);
  });

  it("calculates rounded waste percentage", () => {
    expect(calculateWastePercentage(230, 12)).toBe(5.22);
  });
});
