import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionToken, isValidToken } from "@/lib/auth/token";
import { listAthletes } from "@/lib/running/snapshot";

async function requireSession() {
  const token = await getSessionToken();
  return isValidToken(token);
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const athletes = await listAthletes();
  return NextResponse.json({ athletes });
}

export async function POST(request: NextRequest) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("athletes")
    .insert({ label })
    .select("id, label")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ athlete: data });
}
