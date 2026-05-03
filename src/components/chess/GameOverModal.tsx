"use client";

import { useEffect, useState } from "react";
import { X, Trophy, Handshake } from "lucide-react";
import type { GameOver } from "@/types/chess";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

interface GameOverModalProps {
  gameOver: GameOver | null;
  myColor: "w" | "b" | null;
}

export function GameOverModal({ gameOver, myColor }: GameOverModalProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (gameOver) setOpen(true);
  }, [gameOver]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!gameOver || !open) return null;

  const isDraw = gameOver.result === "1/2-1/2";
  const iWon = !isDraw && myColor !== null && gameOver.winner === myColor;
  const iLost = !isDraw && myColor !== null && gameOver.winner !== myColor;

  const headline = isDraw
    ? t.game.draw
    : gameOver.winner === "w"
      ? t.game.whiteWon
      : t.game.blackWon;

  const personal = iWon
    ? t.game.youWon
    : iLost
      ? t.game.youLost
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div
        className={cn(
          "relative w-full max-w-sm rounded-2xl border bg-card p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200",
        )}
      >
        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="text-center">
          <div
            className={cn(
              "mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full",
              iWon && "bg-amber-500/15 text-amber-500",
              iLost && "bg-rose-500/15 text-rose-500",
              isDraw && "bg-secondary text-foreground",
            )}
            aria-hidden="true"
          >
            {isDraw ? (
              <Handshake className="h-7 w-7" />
            ) : (
              <Trophy className="h-7 w-7" />
            )}
          </div>

          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t.game.gameOver}
          </p>
          <h2
            id="game-over-title"
            className="mt-1 text-2xl font-semibold tracking-tight"
          >
            {personal ?? headline}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.game.termination[gameOver.termination]} · {gameOver.result}
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.common.close ?? "Закрыть"}
          </button>
        </div>
      </div>
    </div>
  );
}
