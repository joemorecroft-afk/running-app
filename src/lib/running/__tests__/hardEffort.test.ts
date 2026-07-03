import { describe, expect, it } from "vitest";
import { detectHardEffort } from "../hardEffort";

describe("detectHardEffort", () => {
  it("rejects activities outside the duration window regardless of HR", () => {
    const verdict = detectHardEffort({
      movingTimeS: 5 * 60,
      distanceM: 1500,
      avgHr: 190,
      athleteHrMax: 190,
    });
    expect(verdict.isHardEffort).toBe(false);
  });

  it("flags a high-HR sustained effort within the ideal window as hard, high confidence", () => {
    const verdict = detectHardEffort({
      movingTimeS: 20 * 60,
      distanceM: 5000,
      avgHr: 178,
      athleteHrMax: 190,
    });
    expect(verdict.isHardEffort).toBe(true);
    expect(verdict.confidence).toBe("high");
  });

  it("does not flag a low-HR effort even if duration fits", () => {
    const verdict = detectHardEffort({
      movingTimeS: 20 * 60,
      distanceM: 4000,
      avgHr: 140,
      athleteHrMax: 190,
    });
    expect(verdict.isHardEffort).toBe(false);
  });

  it("falls back to duration-only with low confidence when no HR is present", () => {
    const verdict = detectHardEffort({ movingTimeS: 25 * 60, distanceM: 6000 });
    expect(verdict.isHardEffort).toBe(true);
    expect(verdict.confidence).toBe("low");
  });

  it("does not flag duration-only outside the ideal (but within min/max) window", () => {
    const verdict = detectHardEffort({ movingTimeS: 13 * 60, distanceM: 3000 });
    expect(verdict.isHardEffort).toBe(false);
    expect(verdict.confidence).toBe("low");
  });
});
