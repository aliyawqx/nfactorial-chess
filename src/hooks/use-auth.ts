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

      // Если текущий пользователь анонимный — конвертируем (привязываем email)
      // через updateUser. Это сохраняет тот же auth.uid() и всю историю.
      const { data: currentSession } = await supabase.auth.getUser();
      const currentUser = currentSession.user;

      if (currentUser?.is_anonymous) {
        const { error } = await supabase.auth.updateUser({
          email,
          password,
          data: displayName ? { display_name: displayName } : undefined,
        });
        if (error) return { user: null, error: error.message };

        // После updateUser обычно требуется email confirmation.
        // Если confirmation выключен — пользователь сразу не-анонимный.
        const { data: updated } = await supabase.auth.getUser();

        // Также обновим profiles.display_name явно (триггер мог поставить "Гость")
        if (displayName && updated.user?.id) {
          await supabase
            .from("profiles")
            .update({ display_name: displayName })
            .eq("id", updated.user.id);
        }

        return {
          user: updated.user,
          error: null,
          needsConfirmation: !updated.user || updated.user.is_anonymous,
        };
      }

      // Обычная регистрация (анонимный сеанс отсутствует или уже не-anon)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
        },
      });
      if (error) return { user: null, error: error.message };

      // Если сразу есть user (confirmation выключен) — подкорректируем display_name в profiles
      if (data.user?.id && displayName) {
        await supabase
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", data.user.id);
      }

      return {
        user: data.user,
        error: null,
        needsConfirmation: !data.session, // нет session → ждём подтверждения email
      };
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
  };
}
