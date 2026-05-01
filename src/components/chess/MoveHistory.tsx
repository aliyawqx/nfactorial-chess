"use client";

import type { Move } from "chess.js";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/I18nProvider";

interface MoveHistoryProps {
  history: Move[];
  className?: string;
}

export function MoveHistory({ history, className }: MoveHistoryProps) {
  const t = useT();
  const listRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history.length]);

  const pairs: { number: number; white?: Move; black?: Move }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      number: i / 2 + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border bg-card",
        className,
      )}
    >
      <div className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t.game.historyTitle}
      </div>
      <ol
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label={t.game.historyTitle}
        className="flex-1 overflow-y-auto p-2 text-sm font-mono"
      >
        {pairs.length === 0 ? (
          <li className="px-2 py-1 text-muted-foreground">{t.game.noGame}</li>
        ) : (
          pairs.map((pair) => (
            <li
              key={pair.number}
              className="grid grid-cols-[2rem_1fr_1fr] items-center gap-1 rounded px-1 py-0.5 hover:bg-secondary/50"
            >
              <span className="text-muted-foreground tabular-nums">
                {pair.number}.
              </span>
              <span>{pair.white?.san ?? ""}</span>
              <span>{pair.black?.san ?? ""}</span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
