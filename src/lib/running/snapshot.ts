import { createServiceClient } from "@/lib/supabase/server";
import { vdotFromEffort } from "./vdot";
import { lt1Estimate, lt2FromVdot } from "./paces";
import { computeTargets, type Targets } from "./benchmarks";
import { computeGaps, type MetricGap } from "./gaps";
import { resolveValue, type Confidence, type SourcedValue } from "./confidence";
import { computeAcwr, type AcwrResult, type LoadPoint } from "./acwr";

const HARD_EFFORT_LOOKBACK_DAYS = 90;
const ACWR_LOOKBACK_DAYS = 35; // 28-day chronic window + 7-day acute window

export interface AthleteRow {
  id: string;
  label: string;
  hr_max: number | null;
  resting_hr: number | null;
  hr_zones: unknown;
  goal_marathon_time_seconds: number | null;
  race_date: string | null;
  vo2max_manual: number | null;
  vo2max_manual_confidence: Confidence | null;
  lt1_manual_pace_sec_per_km: number | null;
  lt1_manual_confidence: Confidence | null;
  lt2_manual_pace_sec_per_km: number | null;
  lt2_manual_confidence: Confidence | null;
  strava_athlete_id: number | null;
}

export interface Snapshot {
  athlete: AthleteRow;
  targets: Targets;
  gaps: MetricGap[];
  acwr: AcwrResult;
  volumeScore: number;
  intensityScore: number;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function ratioToTarget(
  current: number | null,
  target: number,
  higherIsBetter: boolean
): number {
  if (current === null || current === 0) return 1; // neutral: renders as "at target"
  return higherIsBetter ? current / target : target / current;
}

export async function getAthlete(athleteId: string): Promise<AthleteRow> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("athletes")
    .select(
      "id, label, hr_max, resting_hr, hr_zones, goal_marathon_time_seconds, race_date, vo2max_manual, vo2max_manual_confidence, lt1_manual_pace_sec_per_km, lt1_manual_confidence, lt2_manual_pace_sec_per_km, lt2_manual_confidence, strava_athlete_id"
    )
    .eq("id", athleteId)
    .single();

  if (error || !data) throw new Error(`Athlete ${athleteId} not found`);
  return data as AthleteRow;
}

export async function listAthletes(): Promise<{ id: string; label: string }[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("athletes")
    .select("id, label")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Best (highest-VDOT) recent hard effort, used as the Strava-derived VO2max estimate. */
async function findDerivedVdot(
  athleteId: string
): Promise<{ value: number; confidence: Confidence } | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("activities")
    .select("distance_m, moving_time_s")
    .eq("athlete_id", athleteId)
    .eq("is_hard_effort", true)
    .gte("start_date", daysAgoIso(HARD_EFFORT_LOOKBACK_DAYS));

  if (error) throw error;
  if (!data || data.length === 0) return null;

  let best: { vdot: number; withinIdealRange: boolean } | null = null;
  for (const row of data) {
    const result = vdotFromEffort({
      distanceM: Number(row.distance_m),
      timeMin: row.moving_time_s / 60,
    });
    if (!best || result.vdot > best.vdot) best = result;
  }
  if (!best) return null;

  return { value: best.vdot, confidence: best.withinIdealRange ? "high" : "med" };
}

async function computeCurrentWeeklyVolumeKm(athleteId: string): Promise<number | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("activities")
    .select("distance_m")
    .eq("athlete_id", athleteId)
    .gte("start_date", daysAgoIso(7));

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const totalM = data.reduce((sum, row) => sum + Number(row.distance_m), 0);
  return totalM / 1000;
}

async function computeAthleteAcwr(athleteId: string): Promise<AcwrResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("activities")
    .select("start_date, session_load")
    .eq("athlete_id", athleteId)
    .gte("start_date", daysAgoIso(ACWR_LOOKBACK_DAYS));

  if (error) throw error;

  const loadPoints: LoadPoint[] = (data ?? []).map((row) => ({
    date: row.start_date,
    sessionLoad: Number(row.session_load ?? 0),
  }));

  return computeAcwr(loadPoints, new Date().toISOString());
}

export async function buildSnapshot(athleteId: string): Promise<Snapshot> {
  const athlete = await getAthlete(athleteId);

  const goalMarathonTimeSec = athlete.goal_marathon_time_seconds ?? 4 * 3600;
  const raceDate = athlete.race_date ?? new Date().toISOString().slice(0, 10);
  const targets = computeTargets({ goalMarathonTimeSec, raceDate });

  const [derivedVdot, weeklyVolumeKm, acwr] = await Promise.all([
    findDerivedVdot(athleteId),
    computeCurrentWeeklyVolumeKm(athleteId),
    computeAthleteAcwr(athleteId),
  ]);

  const vo2max: SourcedValue<number> = resolveValue(
    athlete.vo2max_manual !== null
      ? { value: athlete.vo2max_manual, confidence: athlete.vo2max_manual_confidence ?? undefined }
      : null,
    derivedVdot
  );

  const derivedLt2 =
    vo2max.value !== null
      ? { value: lt2FromVdot(vo2max.value), confidence: vo2max.confidence }
      : null;
  const lt2PaceSecPerKm: SourcedValue<number> = resolveValue(
    athlete.lt2_manual_pace_sec_per_km !== null
      ? {
          value: athlete.lt2_manual_pace_sec_per_km,
          confidence: athlete.lt2_manual_confidence ?? undefined,
        }
      : null,
    derivedLt2
  );

  const derivedLt1 =
    vo2max.value !== null
      ? lt1Estimate({ vdot: vo2max.value })
      : lt2PaceSecPerKm.value !== null
        ? lt1Estimate({ lt2PaceSecPerKm: lt2PaceSecPerKm.value })
        : null;
  const lt1PaceSecPerKm: SourcedValue<number> = resolveValue(
    athlete.lt1_manual_pace_sec_per_km !== null
      ? {
          value: athlete.lt1_manual_pace_sec_per_km,
          confidence: athlete.lt1_manual_confidence ?? undefined,
        }
      : null,
    derivedLt1 ? { value: derivedLt1.paceSecPerKm, confidence: derivedLt1.confidence } : null
  );

  const weeklyVolume: SourcedValue<number> =
    weeklyVolumeKm === null
      ? { value: null, confidence: "low", source: "unavailable" }
      : { value: weeklyVolumeKm, confidence: "high", source: "derived" };

  const gaps = computeGaps(
    { vo2max, lt1PaceSecPerKm, lt2PaceSecPerKm, weeklyVolumeKm: weeklyVolume },
    targets
  );

  const volumeScore =
    (ratioToTarget(weeklyVolume.value, targets.weeklyVolumeTargetKm, true) +
      ratioToTarget(lt1PaceSecPerKm.value, targets.lt1PaceSecPerKmTarget, false)) /
    2;
  const intensityScore =
    (ratioToTarget(vo2max.value, targets.vdotTarget, true) +
      ratioToTarget(lt2PaceSecPerKm.value, targets.lt2PaceSecPerKmTarget, false)) /
    2;

  return { athlete, targets, gaps, acwr, volumeScore, intensityScore };
}
