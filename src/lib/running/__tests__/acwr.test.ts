import { describe, expect, it } from "vitest";
import { computeAcwr, computeSessionLoad, type LoadPoint } from "../acwr";

function isoDaysAgo(asOf: Date, daysAgo: number): string {
  const d = new Date(asOf);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

describe("computeSessionLoad", () => {
  it("falls back to duration alone when HR data is missing", () => {
    expect(computeSessionLoad({ movingTimeS: 30 * 60 })).toBe(30);
  });

  it("increases with higher average HR (same duration)", () => {
    const low = computeSessionLoad({ movingTimeS: 30 * 60, avgHr: 130, hrMax: 190, restingHr: 50 });
    const high = computeSessionLoad({ movingTimeS: 30 * 60, avgHr: 170, hrMax: 190, restingHr: 50 });
    expect(high).toBeGreaterThan(low);
  });
});

describe("computeAcwr", () => {
  const asOf = new Date("2026-07-03T00:00:00Z");

  it("gives acwr near 1 and a sweet-spot zone for a steady, unchanging load", () => {
    const points: LoadPoint[] = [];
    for (let d = 0; d < 35; d++) {
      points.push({ date: isoDaysAgo(asOf, d), sessionLoad: 50 });
    }
    const result = computeAcwr(points, asOf.toISOString());
    expect(result.acwr).toBeGreaterThan(0.9);
    expect(result.acwr).toBeLessThan(1.1);
    expect(result.zone).toBe("sweet-spot");
  });

  it("flags an acute spike over a low chronic base as elevated risk", () => {
    const points: LoadPoint[] = [];
    for (let d = 8; d < 28; d++) {
      points.push({ date: isoDaysAgo(asOf, d), sessionLoad: 20 });
    }
    for (let d = 0; d < 7; d++) {
      points.push({ date: isoDaysAgo(asOf, d), sessionLoad: 80 });
    }
    const result = computeAcwr(points, asOf.toISOString());
    expect(result.acwr).toBeGreaterThan(1.5);
    expect(result.riskScore).toBeGreaterThan(50);
  });

  it("treats no training history as undertrained with a nonzero baseline risk", () => {
    const result = computeAcwr([], asOf.toISOString());
    expect(result.acwr).toBe(0);
    expect(result.zone).toBe("undertrained");
    expect(result.riskScore).toBeGreaterThan(0);
  });

  it("keeps components.acwrContribution in sync with the overall riskScore", () => {
    const result = computeAcwr(
      [{ date: isoDaysAgo(asOf, 1), sessionLoad: 40 }],
      asOf.toISOString()
    );
    expect(result.components.acwrContribution).toBe(result.riskScore);
  });
});
