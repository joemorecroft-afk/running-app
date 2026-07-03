import { NextRequest, NextResponse } from "next/server";
import { isValidToken, setSessionToken } from "@/lib/auth/token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (token && (await isValidToken(token))) {
    await setSessionToken(token);
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.redirect(new URL("/no-access", request.url));
}
