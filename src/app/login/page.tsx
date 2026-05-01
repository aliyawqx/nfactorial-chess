"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, Suspense } from "react";
import { Loader2, LogIn } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/hooks/use-auth";

function LoginContent() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get("next") || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t.auth.emailRequired);
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await signIn({ email, password });
    setSubmitting(false);
    if (result.error) {
      setError(t.auth.authError);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-md px-4 py-12">
          <div className="rounded-lg border bg-card p-6 sm:p-8">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight">
              {t.auth.loginTitle}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {t.auth.loginSubtitle}
            </p>

            {!configured ? (
              <div className="rounded-md border border-dashed bg-secondary/40 p-4 text-sm text-muted-foreground">
                {t.online.configureSupabase}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {t.auth.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {t.auth.password}
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t.auth.submitLogin}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t.auth.noAccount}{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                {t.auth.signupLink}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
