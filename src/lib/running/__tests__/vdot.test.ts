import { describe, expect, it } from "vitest";
import {
  percentVO2max,
  predictTimeForVdot,
  vdotForGoalTime,
  vdotFromEffort,
  velocityForVo2,
  vo2Demand,
} from "../vdot";

describe("vo2Demand / velocityForVo2 round trip", () => {
  it("inverts cleanly for a range of velocities", () => {
    for (const v of [150, 200, 250, 300, 350]) {
      const demand = vo2Demand(v);
      expect(velocityForVo2(demand)).toBeCloseTo(v, 6);
    }
  });
});

describe("percentVO2max", () => {
  it("decreases as duration increases", () => {
    expect(percentVO2max(10)).toBeGreaterThan(percentVO2max(30));
    expect(percentVO2max(30)).toBeGreaterThan(percentVO2max(120));
  });
});

describe("vdotFromEffort", () => {
  it("gives a higher VDOT for a faster time over the same distance", () => {
    const fast = vdotFromEffort({ distanceM: 5000, timeMin: 18 });
    const slow = vdotFromEffort({ distanceM: 5000, timeMin: 24 });
    expect(fast.vdot).toBeGreaterThan(slow.vdot);
  });

  it("flags withinIdealRange correctly", () => {
    expect(vdotFromEffort({ distanceM: 5000, timeMin: 20 }).withinIdealRange).toBe(true);
    expect(vdotFromEffort({ distanceM: 1000, timeMin: 3 }).withinIdealRange).toBe(false);
    expect(vdotFromEffort({ distanceM: 42195, timeMin: 240 }).withinIdealRange).toBe(false);
  });

  it("produces a plausible VDOT for a 20-minute 5k", () => {
    const { vdot } = vdotFromEffort({ distanceM: 5000, timeMin: 20 });
    expect(vdot).toBeGreaterThan(35);
    expect(vdot).toBeLessThan(55);
  });
});

describe("vdotForGoalTime / predictTimeForVdot round trip", () => {
  it("recovers the original goal time within a second", () => {
    const goalTimeSec = 3.5 * 3600; // 3:30 marathon
    const vdot = vdotForGoalTime(42195, goalTimeSec);
    const predicted = predictTimeForVdot(42195, vdot);
    expect(predicted).toBeCloseTo(goalTimeSec, 0);
  });

  it("gives a higher required VDOT for a faster goal time", () => {
    const vdotSub3 = vdotForGoalTime(42195, 3 * 3600);
    const vdotSub4 = vdotForGoalTime(42195, 4 * 3600);
    expect(vdotSub3).toBeGreaterThan(vdotSub4);
  });

  it("is in the right ballpark for a well-known anchor (VDOT ~50 -> ~3:11 marathon)", () => {
    const predicted = predictTimeForVdot(42195, 50);
    // Published VDOT tables put this at roughly 3:10:59 (11459s); allow a wide tolerance
    // since the continuous formula and rounded published tables won't match exactly.
    expect(predicted).toBeGreaterThan(11459 - 180);
    expect(predicted).toBeLessThan(11459 + 180);
  });
});
