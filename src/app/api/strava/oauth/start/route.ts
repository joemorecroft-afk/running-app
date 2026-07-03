import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, isValidToken } from "@/lib/auth/token";
import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";

const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const SCOPES = "activity:read_all,profile:read_all";

export async function GET(request: NextRequest) {
  const token = await getSessionToken();
  if (!(await isValidToken(token))) {
    return NextResponse.redirect(new URL("/no-access", request.url));
  }

  const athleteId = await resolveActiveAthleteId();
  if (!athleteId) {
    return NextResponse.redirect(new URL("/settings", request.url));
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Strava is not configured" }, { status: 500 });
  }

  const redirectUri = new URL("/api/strava/oauth/callback", request.url).toString();

  const authorizeUrl = new URL(STRAVA_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("approval_prompt", "auto");
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("state", athleteId);

  return NextResponse.redirect(authorizeUrl);
}
