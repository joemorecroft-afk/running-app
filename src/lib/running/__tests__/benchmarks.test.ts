import { describe, expect, it } from "vitest";
import { computeTargets } from "../benchmarks";

describe("computeTargets", () => {
  it("gives an LT1 target slower than the LT2 target", () => {
    const targets = computeTargets({ goalMarathonTimeSec: 3.5 * 3600, raceDate: "2026-10-01" });
    expect(targets.lt1PaceSecPerKmTarget).toBeGreaterThan(targets.lt2PaceSecPerKmTarget);
  });

  it("matches the volume band anchor exactly when the goal time matches an anchor", () => {
    const targets = computeTargets({ goalMarathonTimeSec: 3.5 * 3600, raceDate: "2026-10-01" });
    expect(targets.weeklyVolumeTargetKm).toBeCloseTo(77.5, 5);
  });

  it("gives a higher VDOT target and higher volume target for a faster goal", () => {
    const fast = computeTargets({ goalMarathonTimeSec: 3 * 3600, raceDate: "2026-10-01" });
    const slow = computeTargets({ goalMarathonTimeSec: 4.5 * 3600, raceDate: "2026-10-01" });
    expect(fast.vdotTarget).toBeGreaterThan(slow.vdotTarget);
    expect(fast.weeklyVolumeTargetKm).toBeGreaterThan(slow.weeklyVolumeTargetKm);
  });

  it("stamps the volume-bands version for traceability", () => {
    const targets = computeTargets({ goalMarathonTimeSec: 4 * 3600, raceDate: "2026-10-01" });
    expect(targets.source.volumeBandsVersion).toBeTruthy();
  });
});
