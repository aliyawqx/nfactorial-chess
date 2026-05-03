"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2, KeyRound, Check, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { updatePassword, configured } = useAuth();
  const { user, loading: userLoading } = useSupabaseUser();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await updatePassword(password);
    if (result.error) {
      const msg = result.error.toLowerCase();
      // Supabase: "New password should be different from the old password"
      // или code "same_password" — отдельное сообщение чтобы не путать
      // пользователя с "ссылка устарела".
      const isSamePassword =
        msg.includes("different from the old") ||
        msg.includes("same_password") ||
        msg.includes("same password");
      setError(isSamePassword ? t.auth.samePasswordError : t.auth.resetError);
      setSubmitting(false);
      return;
    }
    // После успешной смены пароля разлогиниваем чтобы юзер вошёл уже свежим.
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setDone(true);
    setSubmitting(false);
    setTimeout(() => router.push("/login"), 2000);
  };

  if (!configured) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="container mx-auto max-w-md px-4 py-12 text-center text-sm text-muted-foreground">
            {t.online.configureSupabase}
          </div>
        </main>
      </>
    );
  }

  if (userLoading) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    );
  }

  // Нет активной session → ссылка устарела или прямой заход
  if (!user) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="container mx-auto max-w-md px-4 py-12">
            <div className="rounded-lg border bg-card p-6 sm:p-8 text-center">
              <AlertCircle
                className="mx-auto mb-4 h-10 w-10 text-amber-500"
                aria-hidden="true"
              />
              <h1 className="mb-2 text-xl font-semibold">{t.auth.linkExpired}</h1>
              <Link
                href="/forgot-password"
                className={cn(buttonVariants({ size: "sm" }), "mt-4")}
              >
                {t.auth.requestNewLink}
              </Link>
              <div className="mt-3">
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t.auth.backToLogin}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-md px-4 py-12">
          <div className="rounded-lg border bg-card p-6 sm:p-8">
            {done ? (
              <div className="text-center">
                <Check
                  className="mx-auto mb-4 h-10 w-10 text-emerald-500"
                  aria-hidden="true"
                />
                <h1 className="mb-2 text-xl font-semibold">{t.auth.resetSuccess}</h1>
              </div>
            ) : (
              <>
                <h1 className="mb-1 text-2xl font-semibold tracking-tight">
                  {t.auth.resetTitle}
                </h1>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t.auth.resetSubtitle}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {t.auth.newPassword}
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                    )}
                    {t.auth.resetSubmit}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  <Link href="/login" className="hover:text-foreground">
                    {t.auth.backToLogin}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
