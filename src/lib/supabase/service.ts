import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role client. Bypasses RLS — use ONLY in server-side API routes
 * for trusted operations (writing to `games`, finalizing matches, etc).
 * Never expose this client to the browser.
 */
export function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service env not configured: SUPABASE_SERVICE_ROLE_KEY missing",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
