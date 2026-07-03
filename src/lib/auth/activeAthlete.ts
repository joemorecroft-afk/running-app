import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

const ACTIVE_ATHLETE_COOKIE = "running_app_active_athlete";

export async function getActiveAthleteIdCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACTIVE_ATHLETE_COOKIE)?.value;
}

export async function setActiveAthleteIdCookie(athleteId: string) {
  const store = await cookies();
  store.set(ACTIVE_ATHLETE_COOKIE, athleteId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * Resolves which athlete profile is "active" under the one shared link: the cookie if it
 * still points at a real athlete, otherwise the first athlete (by creation order). Read-only —
 * safe to call from Server Components. Does NOT persist the fallback; only the explicit
 * "switch" action (a Route Handler) writes the cookie. Returns null only if no athlete
 * profiles exist yet.
 */
export async function resolveActiveAthleteId(): Promise<string | null> {
  const supabase = createServiceClient();
  const cookieId = await getActiveAthleteIdCookie();

  if (cookieId) {
    const { data } = await supabase.from("athletes").select("id").eq("id", cookieId).maybeSingle();
    if (data) return cookieId;
  }

  const { data: first } = await supabase
    .from("athletes")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return first?.id ?? null;
}
