import { vdotForGoalTime } from "./vdot";
import { lt1Estimate, lt2FromVdot } from "./paces";
import { interpolateVolumeBand, VOLUME_BANDS_VERSION } from "@/data/volumeBands";

const MARATHON_METERS = 42195;

export interface GoalInputs {
  goalMarathonTimeSec: number;
  /** ISO date. Unused for MVP's static targets — kept for V2 periodization. */
  raceDate: string;
}

export interface Targets {
  vdotTarget: number;
  vo2maxTarget: number;
  lt1PaceSecPerKmTarget: number;
  lt2PaceSecPerKmTarget: number;
  weeklyVolumeTargetKm: number;
  source: { volumeBandsVersion: string };
}

/**
 * The single entry point: goal marathon time -> all 4 targets. VDOT/LT1/LT2 targets are
 * self-generated via the Daniels equations; only the weekly-volume target comes from a
 * lookup table (see src/data/volumeBands.ts).
 */
export function computeTargets(goal: GoalInputs): Targets {
  const vdotTarget = vdotForGoalTime(MARATHON_METERS, goal.goalMarathonTimeSec);
  const lt2PaceSecPerKmTarget = lt2FromVdot(vdotTarget);
  const lt1 = lt1Estimate({ vdot: vdotTarget });

  return {
    vdotTarget,
    vo2maxTarget: vdotTarget,
    lt1PaceSecPerKmTarget: lt1.paceSecPerKm,
    lt2PaceSecPerKmTarget,
    weeklyVolumeTargetKm: interpolateVolumeBand(goal.goalMarathonTimeSec),
    source: { volumeBandsVersion: VOLUME_BANDS_VERSION },
  };
}
