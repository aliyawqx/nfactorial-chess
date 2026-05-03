"use client";

import { useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "./use-supabase-user";

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams extends SignInParams {
  displayName?: string;
}

export interface AuthResult {
  user: User | null;
  error: string | null;
  needsConfirmation?: boolean;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  configured: boolean;
  isAnonymous: boolean;
  signIn: (params: SignInParams) => Promise<AuthResult>;
  signUp: (params: SignUpParams) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

export function useAuth(): UseAuthReturn {
  const { user, loading, configured } = useSupabaseUser();

  const isAnonymous = Boolean(user?.is_anonymous);

  const signIn = useCallback(
    async ({ email, password }: SignInParams): Promise<AuthResult> => {
      if (!configured) return { user: null, error: "Supabase не настроен" };
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { user: null, error: error.message };
      return { user: data.user, error: null };
    },
    [configured],
  );

  const signUp = useCallback(
    async ({ email, password, displayName }: SignUpParams): Promise<AuthResult> => {
      if (!configured) return { user: null, error: "Supabase не настроен" };
      const supabase = getSupabaseClient();

      const { data: currentSession } = await supabase.auth.getUser();
      const currentUser = currentSession.user;

      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;

      // конвертация anonymous: updateUser сохраняет user.id (история не теряется)
      if (currentUser?.is_anonymous) {
        const { error } = await supabase.auth.updateUser({
          email,
          password,
          data: displayName ? { display_name: displayName } : undefined,
        });
        if (error) return { user: null, error: error.message };

        const { data: updated } = await supabase.auth.getUser();

        if (displayName && updated.user?.id) {
          await supabase
            .from("profiles")
            .update({ display_name: displayName })
            .eq("id", updated.user.id);
        }

        return {
          user: updated.user,
          error: null,
          // с включённой email confirmation остаётся anonymous до подтверждения
          needsConfirmation: !updated.user || updated.user.is_anonymous,
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
          emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
        },
      });
      if (error) return { user: null, error: error.message };

      if (data.user?.id && data.session && displayName) {
        await supabase
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", data.user.id);
      }

      return {
        user: data.user,
        error: null,
        needsConfirmation: !data.session,
      };
    },
    [configured],
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      if (!configured) return { error: "Supabase не настроен" };
      const supabase = getSupabaseClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      // pkce — обмен кода на session делает /auth/callback
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: origin
          ? `${origin}/auth/callback?next=/reset-password`
          : undefined,
      });
      return { error: error?.message ?? null };
    },
    [configured],
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ error: string | null }> => {
      if (!configured) return { error: "Supabase не настроен" };
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error?.message ?? null };
    },
    [configured],
  );

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  }, [configured]);

  return {
    user,
    loading,
    configured,
    isAnonymous,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
  };
}
