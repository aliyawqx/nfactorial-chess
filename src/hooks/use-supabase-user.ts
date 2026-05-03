"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface UseSupabaseUserReturn {
  user: User | null;
  loading: boolean;
  configured: boolean;
  ensureSignedIn: () => Promise<User | null>;
}

export function useSupabaseUser(): UseSupabaseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabaseClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setUser(session?.user ?? null);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [configured]);

  const ensureSignedIn = async (): Promise<User | null> => {
    if (!configured) return null;
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase.auth.getUser();
    if (existing.user) return existing.user;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("anonymous sign-in failed:", error.message);
      return null;
    }
    return data.user ?? null;
  };

  return { user, loading, configured, ensureSignedIn };
}
