"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Check, User as UserIcon } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useProfile } from "@/hooks/use-profile";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "KZ", flag: "🇰🇿", name: "Қазақстан" },
  { code: "RU", flag: "🇷🇺", name: "Россия" },
  { code: "UZ", flag: "🇺🇿", name: "Oʻzbekiston" },
  { code: "KG", flag: "🇰🇬", name: "Кыргызстан" },
  { code: "TJ", flag: "🇹🇯", name: "Тоҷикистон" },
  { code: "BY", flag: "🇧🇾", name: "Беларусь" },
  { code: "UA", flag: "🇺🇦", name: "Україна" },
  { code: "TR", flag: "🇹🇷", name: "Türkiye" },
  { code: "DE", flag: "🇩🇪", name: "Deutschland" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "US", flag: "🇺🇸", name: "United States" },
];

export default function ProfileSettingsPage() {
  const { t, setLocale } = useI18n();
  const { user, configured, loading: userLoading } = useSupabaseUser();
  const { profile, loading: profileLoading, refresh } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("KZ");
  const [language, setLanguage] = useState<Locale>("ru");
  const [submitting, setSubmitting] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Подгружаем текущие значения когда profile приходит
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setCity(profile.city ?? "");
      setCountry(profile.country || "KZ");
      setLanguage((profile.preferred_language as Locale) ?? "ru");
    }
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSavedOk(false);
    setSubmitting(true);

    const supabase = getSupabaseClient();
    const trimmedName = displayName.trim() || null;
    const trimmedCity = city.trim() || null;

    const { error: dbErr } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedName,
        city: trimmedCity,
        country: country || "KZ",
        preferred_language: language,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (dbErr) {
      setError(t.profile.saveError);
      setSubmitting(false);
      return;
    }

    // Синхронизируем display_name с auth.user.user_metadata,
    // чтобы Header видел свежее имя без перезагрузки.
    if (trimmedName) {
      await supabase.auth.updateUser({
        data: { display_name: trimmedName },
      });
    }

    // Применяем смену UI-локали
    setLocale(language);

    refresh();
    setSavedOk(true);
    setSubmitting(false);
    setTimeout(() => setSavedOk(false), 3000);
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

  if (!user) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="container mx-auto max-w-md px-4 py-12 text-center">
            <UserIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="mb-6 text-sm text-muted-foreground">{t.profile.requiredAuth}</p>
            <Link
              href="/login?next=/settings/profile"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t.common.login}
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.profile.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.profile.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-6">
            {profileLoading && !profile ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Display name */}
                <div>
                  <label
                    htmlFor="display-name"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {t.profile.displayName}
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={32}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.profile.displayNameHint}
                  </p>
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="city"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {t.profile.city}
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={64}
                    placeholder={t.profile.cityPlaceholder}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Country */}
                <div>
                  <label
                    htmlFor="country"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {t.profile.country}
                  </label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label
                    htmlFor="language"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {t.profile.language}
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Locale)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {LOCALES.map((l) => (
                      <option key={l} value={l}>
                        {LOCALE_LABELS[l]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current ELO (readonly) */}
                {profile && (
                  <div className="rounded-md bg-secondary/40 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                      {t.profile.currentElo}:
                    </span>{" "}
                    <span className="font-mono font-semibold">{profile.elo}</span>
                  </div>
                )}

                {error && (
                  <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                    {t.profile.save}
                  </Button>
                  {savedOk && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400" role="status">
                      ✓ {t.profile.saved}
                    </span>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </main>
    </>
  );
}
