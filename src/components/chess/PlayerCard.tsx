"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";

const COUNTRY_FLAGS: Record<string, string> = {
  KZ: "🇰🇿",
  RU: "🇷🇺",
  US: "🇺🇸",
  GB: "🇬🇧",
  UA: "🇺🇦",
  BY: "🇧🇾",
  UZ: "🇺🇿",
  KG: "🇰🇬",
  TJ: "🇹🇯",
  TR: "🇹🇷",
  DE: "🇩🇪",
};

export interface PlayerInfo {
  displayName: string | null;
  elo: number | null;
  country: string | null;
  city: string | null;
  rank: number | null; // null = нет ранга (нет finished games)
  isPro?: boolean;
}

interface PlayerCardProps {
  player: PlayerInfo | null;
  color: "white" | "black";
  isYou?: boolean;
  isCurrentTurn?: boolean;
  loading?: boolean;
  className?: string;
}

export function PlayerCard({
  player,
  color,
  isYou = false,
  isCurrentTurn = false,
  loading = false,
  className,
}: PlayerCardProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-card p-3",
          className,
        )}
      >
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
          <div className="h-2 w-16 animate-pulse rounded bg-secondary/60" />
        </div>
      </div>
    );
  }

  const name = player?.displayName || t.common.guest;
  const initial = name.slice(0, 1).toUpperCase();
  const flag = player?.country ? (COUNTRY_FLAGS[player.country] ?? "🌍") : "";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 transition",
        isCurrentTurn && "border-primary shadow-sm",
        className,
      )}
      role="group"
      aria-label={isYou ? t.online.you : t.online.opponent}
    >
      {/* Color indicator + avatar */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm",
            player?.isPro
              ? "bg-gradient-to-br from-amber-400 to-fuchsia-500 text-white"
              : "bg-secondary text-foreground",
          )}
        >
          {initial}
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "absolute -bottom-0.5 -right-0.5 inline-block h-3 w-3 rounded-full border-2 border-card",
            color === "white" ? "bg-white" : "bg-foreground",
          )}
        />
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{name}</span>
          {flag && <span aria-label={player?.country ?? ""}>{flag}</span>}
          {isYou && (
            <span className="rounded-sm bg-primary/15 px-1 py-px text-[9px] font-medium uppercase tracking-wider text-primary">
              {t.online.you}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {player?.elo !== null && player?.elo !== undefined && (
            <span className="font-mono">ELO {player.elo}</span>
          )}
          {player?.rank ? (
            <span
              className="inline-flex items-center gap-0.5"
              aria-label={`${t.online.rank}: ${player.rank}`}
            >
              <Trophy className="h-2.5 w-2.5" aria-hidden="true" />
              #{player.rank}
            </span>
          ) : null}
          {player?.city && (
            <span className="hidden sm:inline truncate">· {player.city}</span>
          )}
        </div>
      </div>

      {/* Turn indicator (animated dot) */}
      {isCurrentTurn && (
        <div className="shrink-0">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        </div>
      )}
    </div>
  );
}
