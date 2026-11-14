import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/** Service-role client — bypasses RLS. Only use on the server after authorising the caller. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
