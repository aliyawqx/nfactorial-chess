"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/hooks/use-auth";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const { requestPasswordReset, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t.auth.emailRequired);
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await requestPasswordReset(email);
    setSubmitting(false);
    if (result.error) {
      setError(t.auth.forgotError);
      return;
    }
    setSent(true);
  };

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-md px-4 py-12">
          <div className="rounded-lg border bg-card p-6 sm:p-8">
            {sent ? (
              <div className="text-center">
                <Mail className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
                <h1 className="mb-2 text-xl font-semibold">{t.auth.forgotSent}</h1>
                <p className="mb-6 text-sm text-muted-foreground">{email}</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.auth.backToLogin}
                </Link>
              </div>
            ) : (
              <>
                <h1 className="mb-1 text-2xl font-semibold tracking-tight">
                  {t.auth.forgotTitle}
                </h1>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t.auth.forgotSubtitle}
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

                    {error && (
                      <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    <Button type="submit" disabled={submitting} className="w-full">
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Mail className="h-4 w-4" aria-hidden="true" />
                      )}
                      {t.auth.forgotSubmit}
                    </Button>
                  </form>
                )}

                <p className="mt-6 text-center text-sm">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
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
