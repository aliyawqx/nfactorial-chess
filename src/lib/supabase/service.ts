import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// service-role: bypass RLS, никогда не отдавать в браузер
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
