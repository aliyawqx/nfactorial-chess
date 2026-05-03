"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Check, User as UserIcon, Lock, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useProfile } from "@/hooks/use-profile";
import { getSupabaseClient } from "@/lib/supabase/client";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { ALL_SKIN_IDS, SKINS, type SkinId, isValidSkin } from "@/lib/chess/skins";
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
  const [activeSkin, setActiveSkin] = useState<SkinId>("cburnett");
  const [submitting, setSubmitting] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = profile?.is_pro === true;

  // Подгружаем текущие значения когда profile приходит
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setCity(profile.city ?? "");
      setCountry(profile.country || "KZ");
      setLanguage((profile.preferred_language as Locale) ?? "ru");
      setActiveSkin(isValidSkin(profile.active_skin) ? profile.active_skin : "cburnett");
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

    // Скин может выбираться только Pro; не-Pro принудительно cburnett
    const finalSkin = isPro ? activeSkin : "cburnett";

    const { error: dbErr } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedName,
        city: trimmedCity,
        country: country || "KZ",
        preferred_language: language,
        active_skin: finalSkin,
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

                {/* Skin selector */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t.shop.skinSelector}
                    </label>
                    {!isPro && (
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
                      >
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Pro
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_SKIN_IDS.map((id) => {
                      const skin = SKINS[id];
                      const locked = skin.proOnly && !isPro;
                      const selected = activeSkin === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => !locked && setActiveSkin(id)}
                          disabled={locked}
                          aria-pressed={selected}
                          className={cn(
                            "relative flex flex-col items-center gap-2 rounded-md border p-2 transition",
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : "border-input hover:border-foreground/30",
                            locked && "opacity-60 cursor-not-allowed",
                          )}
                        >
                          <div className="flex h-12 w-12 items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/pieces/${id}/wN.svg`}
                              alt=""
                              className="h-full w-full"
                              draggable={false}
                            />
                          </div>
                          <span className="text-[11px] font-medium">{skin.name}</span>
                          {locked && (
                            <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-sm bg-muted px-1 text-[9px] font-semibold uppercase">
                              <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                            </span>
                          )}
                          {selected && !locked && (
                            <span className="absolute right-1 top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-2.5 w-2.5" aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!isPro && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t.shop.skinsBlocked}
                    </p>
                  )}
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
