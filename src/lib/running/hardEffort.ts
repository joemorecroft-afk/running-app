export interface HardEffortInput {
  movingTimeS: number;
  distanceM: number;
  avgHr?: number;
  athleteHrMax?: number;
}

export interface HardEffortVerdict {
  isHardEffort: boolean;
  reason: string;
  confidence: "low" | "med" | "high";
}

// Tunable thresholds, centralized here — retune against real training history once it
// exists (this heuristic is the highest-uncertainty piece of the MVP, see the build plan).
const MIN_DURATION_MIN = 12;
const MAX_DURATION_MIN = 60;
const IDEAL_MIN_DURATION_MIN = 15;
const IDEAL_MAX_DURATION_MIN = 50;
const HR_FRACTION_THRESHOLD = 0.9;

/** Heuristic: is this activity a plausible maximal effort worth feeding into the VDOT calc? */
export function detectHardEffort(input: HardEffortInput): HardEffortVerdict {
  const durationMin = input.movingTimeS / 60;

  if (durationMin < MIN_DURATION_MIN || durationMin > MAX_DURATION_MIN) {
    return {
      isHardEffort: false,
      reason: `Duration ${durationMin.toFixed(0)}min outside the ${MIN_DURATION_MIN}-${MAX_DURATION_MIN}min window`,
      confidence: "high",
    };
  }

  const withinIdeal =
    durationMin >= IDEAL_MIN_DURATION_MIN && durationMin <= IDEAL_MAX_DURATION_MIN;

  if (input.avgHr !== undefined && input.athleteHrMax) {
    const hrFraction = input.avgHr / input.athleteHrMax;
    if (hrFraction >= HR_FRACTION_THRESHOLD) {
      return {
        isHardEffort: true,
        reason: `Avg HR ${(hrFraction * 100).toFixed(0)}% of max sustained for ${durationMin.toFixed(0)}min`,
        confidence: withinIdeal ? "high" : "med",
      };
    }
    return {
      isHardEffort: false,
      reason: `Avg HR only ${(hrFraction * 100).toFixed(0)}% of max`,
      confidence: "high",
    };
  }

  // No HR available — fall back to duration alone, always low confidence.
  return {
    isHardEffort: withinIdeal,
    reason: withinIdeal
      ? "No HR data; duration alone suggests a possible hard effort"
      : "No HR data and duration outside the ideal window",
    confidence: "low",
  };
}
