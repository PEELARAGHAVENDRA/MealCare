import { describe, expect, it } from "vitest";
import { average, calculateMealParticipation } from "./analytics-metrics";

describe("analytics metrics", () => {
  it("calculates meal participation percentage", () => {
    expect(calculateMealParticipation(225, 218)).toBe(96.89);
  });

  it("returns zero participation when present count is zero", () => {
    expect(calculateMealParticipation(0, 10)).toBe(0);
  });

  it("averages rounded values", () => {
    expect(average([5.22, 7.1, 3.4])).toBe(5.24);
  });
});
