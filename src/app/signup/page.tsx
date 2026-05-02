"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, Suspense } from "react";
import { Loader2, UserPlus, Mail } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/hooks/use-auth";

function SignupContent() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const { signUp, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const next = params.get("next") || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t.auth.emailRequired);
      return;
    }
    if (password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await signUp({
      email,
      password,
      displayName: displayName.trim() || undefined,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setNeedsConfirmation(true);
      return;
    }
    router.push(next);
    router.refresh();
  };

  if (needsConfirmation) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="container mx-auto max-w-md px-4 py-12">
            <div className="rounded-lg border bg-card p-6 sm:p-8 text-center">
              <Mail className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
              <h1 className="mb-2 text-xl font-semibold">{t.auth.checkEmail}</h1>
              <p className="text-sm text-muted-foreground">
                {email}
              </p>
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
            <h1 className="mb-1 text-2xl font-semibold tracking-tight">
              {t.auth.signupTitle}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {t.auth.signupSubtitle}
            </p>

            {!configured ? (
              <div className="rounded-md border border-dashed bg-secondary/40 p-4 text-sm text-muted-foreground">
                {t.online.configureSupabase}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="display-name"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {t.auth.displayName}
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    autoComplete="nickname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder=""
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={32}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.auth.displayNameHint}
                  </p>
                </div>

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
                    autoComplete="new-password"
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
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t.auth.submitSignup}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t.auth.haveAccount}{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t.auth.loginLink}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}
