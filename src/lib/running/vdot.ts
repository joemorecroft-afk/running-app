// Daniels-Gilbert equations (Daniels & Gilbert, "Oxygen Power", 1979).

export interface EffortInput {
  distanceM: number;
  timeMin: number;
}

export interface VdotResult {
  vdot: number;
  withinIdealRange: boolean;
}

const IDEAL_MIN_MINUTES = 15;
const IDEAL_MAX_MINUTES = 50;

/** VO2 demand (ml/kg/min) to sustain velocity v (m/min). */
export function vo2Demand(vMeterPerMin: number): number {
  return -4.6 + 0.182258 * vMeterPerMin + 0.000104 * vMeterPerMin ** 2;
}

/** Inverse of vo2Demand: velocity (m/min) that requires the given VO2 demand. */
export function velocityForVo2(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;
  const discriminant = b * b - 4 * a * c;
  return (-b + Math.sqrt(discriminant)) / (2 * a);
}

/** Fraction of VO2max a maximal effort of duration timeMin utilizes (Daniels' drop-off curve). */
export function percentVO2max(timeMin: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMin) +
    0.2989558 * Math.exp(-0.1932605 * timeMin)
  );
}

/** VDOT required to run `distanceM` in `timeMin` as a maximal effort. Best fit 15-50 min. */
export function vdotFromEffort({ distanceM, timeMin }: EffortInput): VdotResult {
  const velocity = distanceM / timeMin;
  const demand = vo2Demand(velocity);
  const pct = percentVO2max(timeMin);
  return {
    vdot: demand / pct,
    withinIdealRange: timeMin >= IDEAL_MIN_MINUTES && timeMin <= IDEAL_MAX_MINUTES,
  };
}

/**
 * Required VDOT to achieve `goalTimeSec` over `distanceM` — a goal time is itself a
 * hypothetical maximal effort, so this is just the forward calculation applied to it.
 */
export function vdotForGoalTime(distanceM: number, goalTimeSec: number): number {
  return vdotFromEffort({ distanceM, timeMin: goalTimeSec / 60 }).vdot;
}

/**
 * Predicts race time (seconds) for `distanceM` at a given VDOT. Solved via bisection since
 * %VO2max utilized depends on the resulting duration itself — there's no closed-form inverse.
 * `vdotFromEffort({distanceM, timeMin}).vdot` is monotonically decreasing in timeMin, which is
 * what makes the bisection well-defined.
 */
export function predictTimeForVdot(distanceM: number, vdot: number): number {
  let lo = 3; // minutes
  let hi = 300;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const impliedVdot = vdotFromEffort({ distanceM, timeMin: mid }).vdot;
    if (impliedVdot > vdot) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return ((lo + hi) / 2) * 60;
}
