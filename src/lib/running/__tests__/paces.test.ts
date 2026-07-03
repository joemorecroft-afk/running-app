import { describe, expect, it } from "vitest";
import { lt1Estimate, lt2FromVdot, pacesFromVdot } from "../paces";

describe("pacesFromVdot", () => {
  it("orders paces from slowest (easy) to fastest (repetition)", () => {
    const paces = pacesFromVdot(50);
    expect(paces.easyPaceSecPerKm).toBeGreaterThan(paces.mPaceSecPerKm);
    expect(paces.mPaceSecPerKm).toBeGreaterThan(paces.tPaceSecPerKm);
    expect(paces.tPaceSecPerKm).toBeGreaterThan(paces.iPaceSecPerKm);
    expect(paces.iPaceSecPerKm).toBeGreaterThan(paces.rPaceSecPerKm);
  });

  it("gives faster paces for a higher VDOT", () => {
    const lower = pacesFromVdot(45);
    const higher = pacesFromVdot(55);
    expect(higher.tPaceSecPerKm).toBeLessThan(lower.tPaceSecPerKm);
  });
});

describe("lt1Estimate", () => {
  it("VDOT method gives a slower (higher sec/km) pace than LT2", () => {
    const vdot = 50;
    const lt2Pace = lt2FromVdot(vdot);
    const lt1 = lt1Estimate({ vdot });
    expect(lt1.paceSecPerKm).toBeGreaterThan(lt2Pace);
    expect(lt1.method).toBe("vdot");
    expect(lt1.confidence).toBe("high");
  });

  it("falls back to LT2 + 10% when no VDOT is available", () => {
    const lt2Pace = 240; // sec/km
    const lt1 = lt1Estimate({ lt2PaceSecPerKm: lt2Pace });
    expect(lt1.paceSecPerKm).toBeCloseTo(264, 5);
    expect(lt1.method).toBe("lt2-fallback");
    expect(lt1.confidence).toBe("med");
  });

  it("throws when neither input is available", () => {
    expect(() => lt1Estimate({})).toThrow();
  });
});
