import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionToken, isValidToken } from "@/lib/auth/token";

async function requireSession() {
  const token = await getSessionToken();
  return isValidToken(token);
}

const PATCHABLE_FIELDS = [
  "hr_max",
  "resting_hr",
  "goal_marathon_time_seconds",
  "race_date",
  "vo2max_manual",
  "vo2max_manual_confidence",
  "lt1_manual_pace_sec_per_km",
  "lt1_manual_confidence",
  "lt2_manual_pace_sec_per_km",
  "lt2_manual_confidence",
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("athletes").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ athlete: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }
  updates.updated_at = new Date().toISOString();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("athletes")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ athlete: data });
}
