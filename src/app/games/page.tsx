"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2, ChevronRight, Cloud } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { loadGames, deleteGame, type SavedGame } from "@/lib/games-storage";
import { loadOnlineGames } from "@/lib/games-online";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { cn } from "@/lib/utils";

interface GameRow extends SavedGame {
  source: "local" | "online";
}

function formatDuration(ms: number, locale: string) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remSec}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function resultToText(g: GameRow): { text: string; color: string } {
  if (g.result === "1-0") return { text: "1–0", color: "text-emerald-500" };
  if (g.result === "0-1") return { text: "0–1", color: "text-rose-500" };
  if (g.result === "1/2-1/2") return { text: "½–½", color: "text-muted-foreground" };
  return { text: "*", color: "text-muted-foreground" };
}

export default function GamesPage() {
  const { t, locale } = useI18n();
  const { user, configured } = useSupabaseUser();
  const [games, setGames] = useState<GameRow[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const local: GameRow[] = loadGames().map((g) => ({ ...g, source: "local" }));

      let online: GameRow[] = [];
      if (configured && user) {
        const onlineRaw = await loadOnlineGames(user.id);
        online = onlineRaw.map((g) => ({ ...g, source: "online" }));
      }

      // Дедупликация: если онлайн-партия уже есть в localStorage (по pgn)
      // — отдаём приоритет онлайн. Простая защита от дублей.
      const seenPgn = new Set(online.map((g) => g.pgn));
      const merged = [
        ...online,
        ...local.filter((g) => !seenPgn.has(g.pgn)),
      ].sort((a, b) => b.finishedAt - a.finishedAt);

      if (!cancelled) {
        setGames(merged);
        setHydrated(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, configured]);

  const handleDelete = (g: GameRow) => {
    if (g.source === "online") return; // online нельзя удалить с клиента
    if (!confirm(t.games.confirmDelete)) return;
    deleteGame(g.id);
    setGames((prev) => prev.filter((x) => !(x.id === g.id && x.source === "local")));
  };

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.games.title}
          </h1>

          {!hydrated ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-secondary/40"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center text-muted-foreground">
              {t.games.empty}
            </div>
          ) : (
            <ul className="space-y-2">
              {games.map((g) => {
                const r = resultToText(g);
                const date = new Date(g.finishedAt);
                return (
                  <li
                    key={g.id}
                    className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-foreground/20"
                  >
                    <div className={cn("text-2xl font-mono font-semibold", r.color)}>
                      {r.text}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {g.whiteName} {t.games.vs} {g.blackName}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="rounded-md bg-secondary px-1.5 py-0.5">
                          {t.games.modeLabels[g.mode]}
                        </span>
                        {g.source === "online" && (
                          <span
                            aria-label="Облако"
                            className="inline-flex items-center"
                          >
                            <Cloud className="h-3 w-3" aria-hidden="true" />
                          </span>
                        )}
                        <span>{g.plyCount} {t.games.moves}</span>
                        <span>
                          {formatDuration(g.finishedAt - g.startedAt, locale)}
                        </span>
                        <span>{date.toLocaleString(locale)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/games/${g.id}`}
                      aria-label={t.games.view}
                      className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    {g.source === "local" && (
                      <button
                        type="button"
                        aria-label={t.games.delete}
                        onClick={() => handleDelete(g)}
                        className="rounded-md p-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
