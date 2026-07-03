import { createHash } from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export const TOKEN_COOKIE_NAME = "running_app_token";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Validates a raw token against the access_tokens table and bumps last_used_at if valid. */
export async function isValidToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  const supabase = createServiceClient();
  const tokenHash = hashToken(token);

  const { data, error } = await supabase
    .from("access_tokens")
    .select("id")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return false;

  await supabase
    .from("access_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return true;
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE_NAME)?.value;
}

export async function setSessionToken(token: string) {
  const store = await cookies();
  store.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
