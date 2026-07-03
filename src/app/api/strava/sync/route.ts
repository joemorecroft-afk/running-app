import { NextResponse } from "next/server";
import { getSessionToken, isValidToken } from "@/lib/auth/token";
import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";
import { syncAthleteActivities } from "@/lib/strava/sync";
import { RateLimitError } from "@/lib/strava/client";

export async function POST() {
  const token = await getSessionToken();
  if (!(await isValidToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const athleteId = await resolveActiveAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: "no active athlete" }, { status: 404 });
  }

  try {
    const result = await syncAthleteActivities(athleteId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
