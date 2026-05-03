"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const CACHE_KEY_PREFIX = "voicechess:profile:";

function readCache(userId: string): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_PREFIX + userId);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

function writeCache(userId: string, profile: Profile | null) {
  if (typeof window === "undefined") return;
  try {
    if (profile) {
      window.localStorage.setItem(
        CACHE_KEY_PREFIX + userId,
        JSON.stringify(profile),
      );
    } else {
      window.localStorage.removeItem(CACHE_KEY_PREFIX + userId);
    }
  } catch {
    /* quota — ignore */
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useSupabaseUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("profiles")
        .select()
        .eq("id", userId)
        .maybeSingle();
      const next = (data ?? null) as Profile | null;
      setProfile(next);
      writeCache(userId, next);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (!configured || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    // Сначала — мгновенно из cache (если есть)
    const cached = readCache(user.id);
    if (cached) {
      setProfile(cached);
      setLoading(false);
    }
    // Параллельно — fresh fetch чтобы обновить (stale-while-revalidate)
    fetchProfile(user.id);
  }, [user, configured, fetchProfile]);

  const refresh = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }
  return ctx;
}
