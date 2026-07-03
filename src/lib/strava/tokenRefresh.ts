import { createServiceClient } from "@/lib/supabase/server";
import type { StravaTokenResponse } from "./types";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const REFRESH_SAFETY_MARGIN_MS = 5 * 60 * 1000;

export interface StravaTokenFields {
  id: string;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  strava_token_expires_at: string | null;
}

/**
 * Returns a valid access token, refreshing proactively if it's missing or within 5 minutes
 * of expiry. Sync is user-triggered (no background job) for MVP, so a single refresh here
 * per sync call is sufficient — this is not safe against two concurrent syncs racing to
 * refresh at once, which isn't a concern at this scale but would need addressing before any
 * future scheduled/webhook-based sync.
 */
export async function getValidAccessToken(athlete: StravaTokenFields): Promise<string> {
  if (!athlete.strava_refresh_token) {
    throw new Error("Athlete is not connected to Strava");
  }

  const expiresAtMs = athlete.strava_token_expires_at
    ? new Date(athlete.strava_token_expires_at).getTime()
    : 0;
  const needsRefresh =
    !athlete.strava_access_token || expiresAtMs - Date.now() < REFRESH_SAFETY_MARGIN_MS;

  if (!needsRefresh) {
    return athlete.strava_access_token as string;
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Strava is not configured");

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: athlete.strava_refresh_token,
    }),
  });

  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }

  const tokens: StravaTokenResponse = await res.json();

  const supabase = createServiceClient();
  await supabase
    .from("athletes")
    .update({
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", athlete.id);

  return tokens.access_token;
}
