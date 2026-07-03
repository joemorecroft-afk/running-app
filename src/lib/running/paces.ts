import { velocityForVo2 } from "./vdot";

export interface PaceSet {
  easyPaceSecPerKm: number;
  mPaceSecPerKm: number;
  tPaceSecPerKm: number;
  iPaceSecPerKm: number;
  rPaceSecPerKm: number;
}

// Approximate %VO2max utilized at each Daniels training-pace intensity. These are
// commonly-cited approximations of Daniels' published tables (not a closed-form regression) —
// retune these constants if paces drift from real training/race data.
const E_FRACTION = 0.7;
const M_FRACTION = 0.8;
const T_FRACTION = 0.88;
const I_FRACTION = 0.975;
const R_FRACTION = 1.05;

function paceSecPerKmForFraction(vdot: number, fraction: number): number {
  const velocityMeterPerMin = velocityForVo2(vdot * fraction);
  return (1000 / velocityMeterPerMin) * 60;
}

export function pacesFromVdot(vdot: number): PaceSet {
  return {
    easyPaceSecPerKm: paceSecPerKmForFraction(vdot, E_FRACTION),
    mPaceSecPerKm: paceSecPerKmForFraction(vdot, M_FRACTION),
    tPaceSecPerKm: paceSecPerKmForFraction(vdot, T_FRACTION),
    iPaceSecPerKm: paceSecPerKmForFraction(vdot, I_FRACTION),
    rPaceSecPerKm: paceSecPerKmForFraction(vdot, R_FRACTION),
  };
}

/** LT2 (~4 mmol/L, ~HM effort) ≈ Daniels' T-pace. */
export function lt2FromVdot(vdot: number): number {
  return paceSecPerKmForFraction(vdot, T_FRACTION);
}

export interface Lt1EstimateInput {
  vdot?: number;
  lt2PaceSecPerKm?: number;
}

export interface Lt1EstimateResult {
  paceSecPerKm: number;
  method: "vdot" | "lt2-fallback";
  confidence: "low" | "med" | "high";
}

// LT1 pace ≈ LT2 pace + 8-12% slower (brief's fallback heuristic); midpoint used here.
const LT2_TO_LT1_SLOWDOWN = 1.1;

/**
 * LT1 (~2 mmol/L, ~marathon effort) ≈ Daniels' M-pace (primary), falling back to
 * LT2 pace + ~10% slower when no VDOT is available. HR-proxy (~78-82% HRmax) is a
 * V2 extension point — deriving a pace from an HR threshold needs an athlete-specific
 * HR/pace relationship this app doesn't model yet.
 */
export function lt1Estimate(input: Lt1EstimateInput): Lt1EstimateResult {
  if (input.vdot !== undefined) {
    return {
      paceSecPerKm: paceSecPerKmForFraction(input.vdot, M_FRACTION),
      method: "vdot",
      confidence: "high",
    };
  }
  if (input.lt2PaceSecPerKm !== undefined) {
    return {
      paceSecPerKm: input.lt2PaceSecPerKm * LT2_TO_LT1_SLOWDOWN,
      method: "lt2-fallback",
      confidence: "med",
    };
  }
  throw new Error("lt1Estimate requires either a vdot or an lt2PaceSecPerKm");
}
