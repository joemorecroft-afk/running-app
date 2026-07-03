import { describe, expect, it } from "vitest";
import { computeGaps } from "../gaps";
import type { Targets } from "../benchmarks";

const targets: Targets = {
  vdotTarget: 50,
  vo2maxTarget: 50,
  lt1PaceSecPerKmTarget: 260,
  lt2PaceSecPerKmTarget: 230,
  weeklyVolumeTargetKm: 80,
  source: { volumeBandsVersion: "test" },
};

describe("computeGaps", () => {
  it("reports a no-data read when a metric has no current value", () => {
    const gaps = computeGaps(
      {
        vo2max: { value: null, confidence: "low", source: "unavailable" },
        lt1PaceSecPerKm: { value: null, confidence: "low", source: "unavailable" },
        lt2PaceSecPerKm: { value: null, confidence: "low", source: "unavailable" },
        weeklyVolumeKm: { value: null, confidence: "low", source: "unavailable" },
      },
      targets
    );
    const vo2max = gaps.find((g) => g.metric === "vo2max")!;
    expect(vo2max.current).toBeNull();
    expect(vo2max.read).toMatch(/no vo2max/i);
  });

  it("flags weekly volume below target as the biggest lever", () => {
    const gaps = computeGaps(
      {
        vo2max: { value: 50, confidence: "high", source: "manual" },
        lt1PaceSecPerKm: { value: 260, confidence: "high", source: "manual" },
        lt2PaceSecPerKm: { value: 230, confidence: "high", source: "manual" },
        weeklyVolumeKm: { value: 60, confidence: "med", source: "derived" },
      },
      targets
    );
    const volume = gaps.find((g) => g.metric === "volume")!;
    expect(volume.percentDelta).toBeCloseTo(-25, 5);
    expect(volume.read).toMatch(/biggest lever/i);
  });

  it("flags a slower-than-target LT2 pace as a limiter", () => {
    const gaps = computeGaps(
      {
        vo2max: { value: 50, confidence: "high", source: "manual" },
        lt1PaceSecPerKm: { value: 260, confidence: "high", source: "manual" },
        lt2PaceSecPerKm: { value: 250, confidence: "med", source: "derived" }, // slower than 230 target
        weeklyVolumeKm: { value: 80, confidence: "high", source: "manual" },
      },
      targets
    );
    const lt2 = gaps.find((g) => g.metric === "lt2")!;
    expect(lt2.read).toMatch(/limiter/i);
  });
});
