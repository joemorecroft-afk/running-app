// Generates the single shared access link for the app and stores its hash in Supabase.
// Usage: node --env-file=.env.local scripts/generate-access-token.mjs [base-url]

import { randomBytes, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const baseUrl = process.argv[2] ?? "http://localhost:3000";

const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const { error } = await supabase.from("access_tokens").insert({ token_hash: tokenHash });

if (error) {
  console.error("Failed to store token:", error.message);
  process.exit(1);
}

console.log("Access link:");
console.log(`${baseUrl}/?token=${token}`);
