import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "./tokenRefresh";
import { StravaClient } from "./client";
import { detectHardEffort } from "@/lib/running/hardEffort";
import { computeSessionLoad } from "@/lib/running/acwr";
import type { StravaActivitySummary } from "./types";

const INITIAL_IMPORT_DAYS = 90;
// Keep roughly 1 sample per 5s of a stream instead of every raw (often ~1/s) sample, so a
// hard effort's stream payload stays small in the DB and in any future detail-view response.
const STREAM_DOWNSAMPLE_STRIDE = 5;

function downsample(values: number[] | undefined): number[] | undefined {
  if (!values) return undefined;
  return values.filter((_, i) => i % STREAM_DOWNSAMPLE_STRIDE === 0);
}

export interface SyncResult {
  imported: number;
  streamsFetched: number;
}

/**
 * Incremental sync: only pulls activities newer than the last one already stored (never a
 * full historical re-pull), and fetches per-second streams only for activities the hard-effort
 * heuristic flags — this bounds both Strava API usage against the rate limit and DB storage
 * growth. The very first sync for a newly-connected athlete looks back INITIAL_IMPORT_DAYS.
 */
export async function syncAthleteActivities(athleteId: string): Promise<SyncResult> {
  const supabase = createServiceClient();

  const { data: athlete, error: athleteError } = await supabase
    .from("athletes")
    .select("id, hr_max, resting_hr, strava_access_token, strava_refresh_token, strava_token_expires_at")
    .eq("id", athleteId)
    .single();

  if (athleteError || !athlete) throw new Error("Athlete not found");
  if (!athlete.strava_refresh_token) throw new Error("Athlete is not connected to Strava");

  const accessToken = await getValidAccessToken(athlete);
  const client = new StravaClient(accessToken);

  const { data: latest } = await supabase
    .from("activities")
    .select("start_date")
    .eq("athlete_id", athleteId)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nowUnix = Math.floor(Date.now() / 1000) - 1;
  const afterUnix = latest
    ? Math.min(Math.floor(new Date(latest.start_date).getTime() / 1000), nowUnix)
    : Math.floor((Date.now() - INITIAL_IMPORT_DAYS * 24 * 60 * 60 * 1000) / 1000);

  const summaries: StravaActivitySummary[] = [];
  let page = 1;
  for (;;) {
    const batch = await client.listActivities({ after: afterUnix, page, perPage: 100 });
    summaries.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  const runsOnly = summaries.filter((a) => a.type === "Run");

  let imported = 0;
  let streamsFetched = 0;

  for (const activity of runsOnly) {
    const hardEffort = detectHardEffort({
      movingTimeS: activity.moving_time,
      distanceM: activity.distance,
      avgHr: activity.average_heartrate,
      athleteHrMax: athlete.hr_max ?? undefined,
    });

    const sessionLoad = computeSessionLoad({
      movingTimeS: activity.moving_time,
      avgHr: activity.average_heartrate,
      hrMax: athlete.hr_max ?? undefined,
      restingHr: athlete.resting_hr ?? undefined,
    });

    let streams = null;
    if (hardEffort.isHardEffort) {
      try {
        const raw = await client.getActivityStreams(activity.id, [
          "time",
          "distance",
          "heartrate",
          "velocity_smooth",
        ]);
        streams = {
          time: downsample(raw.time?.data),
          distance: downsample(raw.distance?.data),
          heartrate: downsample(raw.heartrate?.data),
          velocity_smooth: downsample(raw.velocity_smooth?.data),
        };
        streamsFetched += 1;
      } catch {
        // Non-fatal: keep the activity without streams rather than failing the whole sync.
      }
    }

    const { error } = await supabase.from("activities").upsert(
      {
        athlete_id: athleteId,
        strava_id: activity.id,
        name: activity.name,
        start_date: activity.start_date,
        distance_m: activity.distance,
        moving_time_s: activity.moving_time,
        elapsed_time_s: activity.elapsed_time,
        avg_hr: activity.average_heartrate ?? null,
        max_hr: activity.max_heartrate ?? null,
        avg_cadence: activity.average_cadence ?? null,
        avg_pace_sec_per_km:
          activity.distance > 0 ? activity.moving_time / (activity.distance / 1000) : null,
        streams,
        session_load: sessionLoad,
        is_hard_effort: hardEffort.isHardEffort,
        hard_effort_reason: hardEffort.reason,
      },
      { onConflict: "strava_id" }
    );

    if (!error) imported += 1;
  }

  return { imported, streamsFetched };
}
