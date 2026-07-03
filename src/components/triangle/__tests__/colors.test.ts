import { describe, expect, it } from "vitest";
import { riskScoreToColor } from "../colors";

describe("riskScoreToColor", () => {
  it("is green at score 0 and red at score 100", () => {
    expect(riskScoreToColor(0)).toBe("rgb(34, 197, 94)");
    expect(riskScoreToColor(100)).toBe("rgb(239, 68, 68)");
  });

  it("clamps out-of-range scores", () => {
    expect(riskScoreToColor(-10)).toBe(riskScoreToColor(0));
    expect(riskScoreToColor(150)).toBe(riskScoreToColor(100));
  });
});
