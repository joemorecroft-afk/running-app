import { NextResponse } from "next/server";
import { getSessionToken, isValidToken } from "@/lib/auth/token";
import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";
import { buildSnapshot } from "@/lib/running/snapshot";

export async function GET() {
  const token = await getSessionToken();
  if (!(await isValidToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const athleteId = await resolveActiveAthleteId();
  if (!athleteId) {
    return NextResponse.json({ error: "no athletes yet" }, { status: 404 });
  }

  const snapshot = await buildSnapshot(athleteId);
  return NextResponse.json(snapshot);
}
