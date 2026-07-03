export interface SessionLoadInput {
  movingTimeS: number;
  avgHr?: number;
  hrMax?: number;
  restingHr?: number;
}

/**
 * Banister TRIMP-style session load: duration x HR-reserve fraction x an exponential
 * weighting that up-weights higher-intensity efforts. Falls back to duration alone (low
 * fidelity) when HR data isn't available.
 */
export function computeSessionLoad(input: SessionLoadInput): number {
  const durationMin = input.movingTimeS / 60;

  if (input.avgHr === undefined || !input.hrMax || input.restingHr === undefined) {
    return durationMin;
  }

  const hrReserveFraction =
    (input.avgHr - input.restingHr) / (input.hrMax - input.restingHr);
  const clamped = Math.max(0, Math.min(1, hrReserveFraction));
  const weighting = 0.64 * Math.exp(1.92 * clamped);
  return durationMin * clamped * weighting;
}

export interface LoadPoint {
  date: string; // ISO date
  sessionLoad: number;
}

export interface AcwrComponents {
  acwrContribution: number;
}

export interface AcwrResult {
  acuteLoad: number;
  chronicLoad: number;
  acwr: number;
  riskScore: number;
  zone: "undertrained" | "sweet-spot" | "elevated" | "sharply-elevated";
  components: AcwrComponents;
}

const ACUTE_WINDOW_DAYS = 7;
const CHRONIC_WINDOW_DAYS = 28;
// EWMA time constant for the chronic window, excluding the acute week (21-day span).
const CHRONIC_LAMBDA = 2 / (CHRONIC_WINDOW_DAYS - ACUTE_WINDOW_DAYS + 1);

const BASELINE_RISK = 15;
const ABOVE_SWEET_SPOT_SLOPE = 60;
const BELOW_SWEET_SPOT_SLOPE = 20;

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUTC(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dailyLoadSeries(points: LoadPoint[], startDate: Date, endDate: Date): number[] {
  const totals = new Map<string, number>();
  for (const p of points) {
    const key = p.date.slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + p.sessionLoad);
  }

  const series: number[] = [];
  let cursor = startOfDayUTC(startDate);
  const end = startOfDayUTC(endDate);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    series.push(totals.get(key) ?? 0);
    cursor = addDaysUTC(cursor, 1);
  }
  return series;
}

function ewma(series: number[], lambda: number): number {
  if (series.length === 0) return 0;
  let value = series[0];
  for (let i = 1; i < series.length; i++) {
    value = value + lambda * (series[i] - value);
  }
  return value;
}

function riskScoreForAcwr(acwr: number): number {
  const capped = Number.isFinite(acwr) ? acwr : 4;
  const penalty =
    capped >= 1.0
      ? (capped - 1.0) * ABOVE_SWEET_SPOT_SLOPE
      : (1.0 - capped) * BELOW_SWEET_SPOT_SLOPE;
  return Math.max(0, Math.min(100, BASELINE_RISK + penalty));
}

function zoneForAcwr(acwr: number): AcwrResult["zone"] {
  if (acwr < 0.8) return "undertrained";
  if (acwr <= 1.3) return "sweet-spot";
  if (acwr <= 2.0) return "elevated";
  return "sharply-elevated";
}

/**
 * Acute load = trailing 7-day sum. Chronic load = trailing 28-day EWMA, excluding the
 * acute week from its own denominator (avoids the spurious self-correlation critique of
 * naive coupled ACWR), expressed as a weekly-equivalent figure for direct comparison.
 */
export function computeAcwr(loadPoints: LoadPoint[], asOfDate: string): AcwrResult {
  const asOf = new Date(asOfDate);

  const acuteStart = addDaysUTC(asOf, -(ACUTE_WINDOW_DAYS - 1));
  const acuteLoad = loadPoints
    .filter((p) => new Date(p.date) >= acuteStart && new Date(p.date) <= asOf)
    .reduce((sum, p) => sum + p.sessionLoad, 0);

  const chronicWindowEnd = addDaysUTC(asOf, -ACUTE_WINDOW_DAYS);
  const chronicWindowStart = addDaysUTC(asOf, -(CHRONIC_WINDOW_DAYS - 1));
  const chronicPoints = loadPoints.filter(
    (p) => new Date(p.date) >= chronicWindowStart && new Date(p.date) <= chronicWindowEnd
  );
  const dailySeries = dailyLoadSeries(chronicPoints, chronicWindowStart, chronicWindowEnd);
  const chronicLoad = ewma(dailySeries, CHRONIC_LAMBDA) * 7;

  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : acuteLoad > 0 ? Infinity : 0;
  const riskScore = riskScoreForAcwr(acwr);

  return {
    acuteLoad,
    chronicLoad,
    acwr,
    riskScore,
    zone: zoneForAcwr(acwr),
    components: { acwrContribution: riskScore },
  };
}
