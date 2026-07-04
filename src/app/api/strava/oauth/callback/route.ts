import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, isValidToken } from "@/lib/auth/token";
import { createServiceClient } from "@/lib/supabase/server";
import type { StravaTokenResponse } from "@/lib/strava/types";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export async function GET(request: NextRequest) {
  const token = await getSessionToken();
  if (!(await isValidToken(token))) {
    return NextResponse.redirect(new URL("/no-access", request.url));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const athleteId = searchParams.get("state");
  const deniedOrError = searchParams.get("error");
  const grantedScope = searchParams.get("scope") ?? "";

  if (deniedOrError || !code || !athleteId) {
    return NextResponse.redirect(new URL("/settings?strava=error", request.url));
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Strava is not configured" }, { status: 500 });
  }

  const tokenRes = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/settings?strava=error", request.url));
  }

  const tokens: StravaTokenResponse = await tokenRes.json();

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("athletes")
    .update({
      strava_athlete_id: tokens.athlete?.id ?? null,
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      strava_scope: grantedScope,
      updated_at: new Date().toISOString(),
    })
    .eq("id", athleteId);

  if (error) {
    return NextResponse.redirect(new URL("/settings?strava=error", request.url));
  }

  // Placeholder/seed activities (no strava_id) exist only to demo the app before real data
  // is connected — once an athlete connects Strava, purge them so they don't get counted
  // alongside real activities in volume/ACWR/hard-effort calculations.
  await supabase.from("activities").delete().eq("athlete_id", athleteId).is("strava_id", null);

  return NextResponse.redirect(new URL("/settings?strava=connected", request.url));
}
