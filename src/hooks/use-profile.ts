"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "./use-supabase-user";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  refresh: () => void;
}

export function useProfile(): UseProfileReturn {
  const { user, configured } = useSupabaseUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!configured || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const supabase = getSupabaseClient();
    let cancelled = false;
    setLoading(true);
    supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, configured, tick]);

  return { profile, loading, refresh: () => setTick((n) => n + 1) };
}
