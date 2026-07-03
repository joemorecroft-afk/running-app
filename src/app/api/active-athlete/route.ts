import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, isValidToken } from "@/lib/auth/token";
import { setActiveAthleteIdCookie } from "@/lib/auth/activeAthlete";

export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  if (!(await isValidToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const athleteId = typeof body.athleteId === "string" ? body.athleteId : "";
  if (!athleteId) {
    return NextResponse.json({ error: "athleteId is required" }, { status: 400 });
  }

  await setActiveAthleteIdCookie(athleteId);
  return NextResponse.json({ ok: true });
}
