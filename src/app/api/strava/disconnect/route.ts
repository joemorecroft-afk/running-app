import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, isValidToken } from "@/lib/auth/token";
import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  if (!(await isValidToken(token))) {
    return NextResponse.redirect(new URL("/no-access", request.url));
  }

  const athleteId = await resolveActiveAthleteId();
  if (athleteId) {
    const supabase = createServiceClient();
    await supabase
      .from("athletes")
      .update({
        strava_athlete_id: null,
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        strava_scope: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", athleteId);
  }

  return NextResponse.redirect(new URL("/settings", request.url));
}
