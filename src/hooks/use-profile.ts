"use client";

import { useProfileContext } from "@/lib/profile/ProfileProvider";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  refresh: () => void;
}

export function useProfile(): UseProfileReturn {
  const { profile, loading, refresh } = useProfileContext();
  return {
    profile,
    loading,
    refresh: () => {
      void refresh();
    },
  };
}
