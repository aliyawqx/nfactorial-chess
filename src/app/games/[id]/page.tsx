"use client";

import { use, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Chess, type Move } from "chess.js";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy, Check } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getGame, type SavedGame } from "@/lib/games-storage";
import { getOnlineGame } from "@/lib/games-online";
import { Button } from "@/components/ui/Button";

const ChessBoard = dynamic(
  () => import("@/components/chess/ChessBoard").then((m) => m.ChessBoard),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full max-w-[min(90vh,640px)] mx-auto animate-pulse rounded-lg bg-secondary" />
    ),
  },
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GameDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { t, locale } = useI18n();
  const [game, setGame] = useState<SavedGame | null | undefined>(undefined);
  const [ply, setPly] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const local = getGame(id);
      if (local) {
        if (!cancelled) setGame(local);
        return;
      }
      // UUID-формат → пробуем онлайн-источник
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const online = await getOnlineGame(id);
        if (!cancelled) setGame(online);
      } else {
        if (!cancelled) setGame(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const positions = useMemo(() => {
    if (!game) return [];
    const chess = new Chess();
    try {
      chess.loadPgn(game.pgn);
    } catch {
      return [];
    }
    const movesVerbose = chess.history({ verbose: true }) as Move[];
    const replay = new Chess();
    const fens = [replay.fen()];
    for (const m of movesVerbose) {
      replay.move({ from: m.from, to: m.to, promotion: m.promotion });
      fens.push(replay.fen());
    }
    return fens;
  }, [game]);

  const allMoves = useMemo(() => {
    if (!game) return [];
    const chess = new Chess();
    try {
      chess.loadPgn(game.pgn);
    } catch {
      return [];
    }
    return chess.history({ verbose: true }) as Move[];
  }, [game]);

  useEffect(() => {
    if (positions.length > 0) setPly(positions.length - 1);
  }, [positions.length]);

  const handleCopy = async () => {
    if (!game) return;
    try {
      await navigator.clipboard.writeText(game.pgn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  if (game === undefined) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="container mx-auto max-w-5xl px-4 py-8">
            <div className="aspect-video animate-pulse rounded-lg bg-secondary/40" />
          </div>
        </main>
      </>
    );
  }

  if (game === null) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="container mx-auto max-w-3xl px-4 py-12 text-center">
            <h1 className="mb-4 text-2xl font-semibold">{t.games.notFound}</h1>
            <Link
              href="/games"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t.games.back}
            </Link>
          </div>
        </main>
      </>
    );
  }

  const currentFen = positions[ply] ?? game.finalFen;
  const lastMove =
    ply > 0 && allMoves[ply - 1]
      ? { from: allMoves[ply - 1].from, to: allMoves[ply - 1].to }
      : null;

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-4 sm:py-6">
          <Link
            href="/games"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.games.back}
          </Link>

          <div className="mb-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {game.whiteName} <span className="text-muted-foreground">{t.games.vs}</span> {game.blackName}
              </h1>
              <span className="font-mono text-lg">
                {game.result === "1/2-1/2" ? "½–½" : game.result.replace("-", "–")}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span className="rounded-md bg-secondary px-1.5 py-0.5">{t.games.modeLabels[game.mode]}</span>
              <span>{game.plyCount} {t.games.moves}</span>
              <span>{new Date(game.finishedAt).toLocaleString(locale)}</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <ChessBoard
                position={currentFen}
                onMove={() => null}
                legalMovesFrom={() => []}
                lastMove={lastMove}
                interactive={false}
              />
              <div
                role="group"
                aria-label="Replay controls"
                className="flex items-center justify-center gap-2"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPly(0)}
                  disabled={ply === 0}
                  aria-label="Начало"
                >
                  <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPly((p) => Math.max(0, p - 1))}
                  disabled={ply === 0}
                  aria-label="Предыдущий ход"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <span className="min-w-[5rem] text-center text-sm tabular-nums">
                  {ply} / {positions.length - 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setPly((p) => Math.min(positions.length - 1, p + 1))
                  }
                  disabled={ply >= positions.length - 1}
                  aria-label="Следующий ход"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPly(positions.length - 1)}
                  disabled={ply >= positions.length - 1}
                  aria-label="Конец"
                >
                  <ChevronsRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <aside className="flex flex-col gap-3">
              <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t.games.pgn}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    aria-label={t.games.copyPgn}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.games.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.games.copyPgn}
                      </>
                    )}
                  </Button>
                </div>
                <pre className="max-h-80 overflow-auto p-3 text-xs font-mono leading-relaxed text-muted-foreground">
                  {game.pgn || "—"}
                </pre>
              </div>

              <div className="rounded-lg border bg-card">
                <div className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t.game.historyTitle}
                </div>
                <ol className="max-h-80 overflow-auto p-2 text-sm font-mono">
                  {Array.from({ length: Math.ceil(allMoves.length / 2) }).map(
                    (_, idx) => {
                      const w = allMoves[idx * 2];
                      const b = allMoves[idx * 2 + 1];
                      return (
                        <li
                          key={idx}
                          className="grid grid-cols-[2rem_1fr_1fr] items-center gap-1 px-1 py-0.5"
                        >
                          <span className="text-muted-foreground tabular-nums">
                            {idx + 1}.
                          </span>
                          <button
                            type="button"
                            onClick={() => setPly(idx * 2 + 1)}
                            className={
                              ply === idx * 2 + 1
                                ? "rounded bg-primary px-1 text-left text-primary-foreground"
                                : "rounded px-1 text-left hover:bg-secondary"
                            }
                          >
                            {w?.san}
                          </button>
                          {b && (
                            <button
                              type="button"
                              onClick={() => setPly(idx * 2 + 2)}
                              className={
                                ply === idx * 2 + 2
                                  ? "rounded bg-primary px-1 text-left text-primary-foreground"
                                  : "rounded px-1 text-left hover:bg-secondary"
                              }
                            >
                              {b.san}
                            </button>
                          )}
                        </li>
                      );
                    },
                  )}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
