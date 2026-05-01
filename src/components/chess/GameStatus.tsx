"use client";

import type { GameOver } from "@/types/chess";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/I18nProvider";

interface GameStatusProps {
  turn: "w" | "b";
  inCheck: boolean;
  gameOver: GameOver | null;
  className?: string;
}

export function GameStatus({
  turn,
  inCheck,
  gameOver,
  className,
}: GameStatusProps) {
  const t = useT();

  if (gameOver) {
    const label =
      gameOver.result === "1/2-1/2"
        ? t.game.draw
        : gameOver.winner === "w"
          ? t.game.whiteWon
          : t.game.blackWon;
    return (
      <div
        role="status"
        aria-live="assertive"
        className={cn(
          "rounded-lg border bg-card p-4 text-center",
          className,
        )}
      >
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {t.game.gameOver}
        </div>
        <div className="mt-1 text-xl font-semibold">{label}</div>
        <div className="text-sm text-muted-foreground">
          {t.game.termination[gameOver.termination]} · {gameOver.result}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-between rounded-lg border bg-card px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-3 w-3 rounded-full",
            turn === "w" ? "bg-white border border-foreground/30" : "bg-foreground",
          )}
        />
        <span className="text-sm font-medium">
          {turn === "w" ? t.game.turnWhite : t.game.turnBlack}
        </span>
      </div>
      {inCheck && (
        <span className="rounded-md bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive">
          {t.game.check}
        </span>
      )}
    </div>
  );
}
