"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy, Loader2, Globe2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { buttonVariants } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface LeaderboardRow {
  id: string;
  display_name: string | null;
  city: string | null;
  country: string;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  KZ: "🇰🇿",
  RU: "🇷🇺",
  US: "🇺🇸",
  GB: "🇬🇧",
  UA: "🇺🇦",
  BY: "🇧🇾",
};

export default function LeaderboardPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabaseClient();
    let cancelled = false;

    let query = supabase
      .from("leaderboard")
      .select()
      .gt("games_played", 0) // только те кто реально играл
      .order("elo", { ascending: false })
      .limit(50);

    if (countryFilter !== "all") {
      query = query.eq("country", countryFilter);
    }
    if (cityFilter !== "all") {
      query = query.eq("city", cityFilter);
    }

    query.then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setRows((data ?? []) as LeaderboardRow[]);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [configured, countryFilter, cityFilter]);

  const availableCountries = Array.from(
    new Set((rows ?? []).map((r) => r.country)),
  ).sort();

  const availableCities = Array.from(
    new Set((rows ?? []).map((r) => r.city).filter((c): c is string => !!c)),
  ).sort((a, b) => a.localeCompare(b, "ru"));

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <div className="mb-6 flex items-center gap-3">
            <Trophy className="h-7 w-7 text-amber-500" aria-hidden="true" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.leaderboardPage.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t.leaderboardPage.subtitle}
              </p>
            </div>
          </div>

          {!configured ? (
            <div className="rounded-lg border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">
              {t.online.configureSupabase}
            </div>
          ) : (
            <>
              {/* Filters */}
              {(rows?.length ?? 0) > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {availableCountries.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Globe2
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <label className="text-xs text-muted-foreground">
                        {t.leaderboardPage.filterCountry}:
                      </label>
                      <select
                        value={countryFilter}
                        onChange={(e) => {
                          setCountryFilter(e.target.value);
                          // Сброс города при смене страны
                          setCityFilter("all");
                        }}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="all">{t.leaderboardPage.filterAll}</option>
                        {availableCountries.map((c) => (
                          <option key={c} value={c}>
                            {COUNTRY_FLAGS[c] ?? "🌍"} {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {availableCities.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">
                        {t.leaderboardPage.colCity}:
                      </label>
                      <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="all">{t.leaderboardPage.filterAll}</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : !rows || rows.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t.leaderboardPage.empty}
                  </p>
                  <Link
                    href="/play/online"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    {t.leaderboardPage.ctaPlayOnline}
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border bg-card">
                  <table className="w-full text-sm">
                    <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium tabular-nums w-10">
                          {t.leaderboardPage.colRank}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t.leaderboardPage.colPlayer}
                        </th>
                        <th className="hidden sm:table-cell px-3 py-2 text-left font-medium">
                          {t.leaderboardPage.colCity}
                        </th>
                        <th className="px-3 py-2 text-right font-medium tabular-nums">
                          {t.leaderboardPage.colElo}
                        </th>
                        <th className="hidden sm:table-cell px-3 py-2 text-right font-medium tabular-nums">
                          {t.leaderboardPage.colGames}
                        </th>
                        <th className="hidden md:table-cell px-3 py-2 text-right font-medium tabular-nums">
                          {t.leaderboardPage.colWLD}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => {
                        const name = row.display_name || "—";
                        const initial = name.slice(0, 1).toUpperCase();
                        const rank = idx + 1;
                        const flag = COUNTRY_FLAGS[row.country] ?? "🌍";
                        const medal =
                          rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                        return (
                          <tr key={row.id} className="border-b last:border-0 hover:bg-secondary/30">
                            <td className="px-3 py-2 tabular-nums text-muted-foreground">
                              {medal ? (
                                <span className="text-base">{medal}</span>
                              ) : (
                                rank
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold"
                                >
                                  {initial}
                                </span>
                                <span className="font-medium truncate">{name}</span>
                                <span className="text-base" aria-label={row.country}>
                                  {flag}
                                </span>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-3 py-2 text-muted-foreground">
                              {row.city ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                              {row.elo}
                            </td>
                            <td className="hidden sm:table-cell px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                              {row.games_played}
                            </td>
                            <td className="hidden md:table-cell px-3 py-2 text-right font-mono tabular-nums text-xs text-muted-foreground">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {row.wins}
                              </span>{" "}
                              /{" "}
                              <span>{row.draws}</span>{" "}
                              /{" "}
                              <span className="text-rose-600 dark:text-rose-400">
                                {row.losses}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
