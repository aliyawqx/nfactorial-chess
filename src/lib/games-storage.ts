"use client";

import type { GameMode, GameResult, Termination } from "@/types/chess";

export interface SavedGame {
  id: string;
  mode: GameMode;
  whiteName: string;
  blackName: string;
  result: GameResult;
  termination: Termination;
  pgn: string;
  finalFen: string;
  plyCount: number;
  aiLevel?: number;
  startedAt: number;
  finishedAt: number;
}

const STORAGE_KEY = "voicechess:games-history";
const MAX_GAMES = 100;

export function loadGames(): SavedGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g) => g && typeof g.id === "string" && typeof g.pgn === "string",
    ) as SavedGame[];
  } catch {
    return [];
  }
}

export function saveGame(game: SavedGame): void {
  if (typeof window === "undefined") return;
  try {
    const games = loadGames();
    const next = [game, ...games.filter((g) => g.id !== game.id)].slice(0, MAX_GAMES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota exceeded */
  }
}

export function getGame(id: string): SavedGame | null {
  return loadGames().find((g) => g.id === id) ?? null;
}

export function deleteGame(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const games = loadGames().filter((g) => g.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    /* ignore */
  }
}

export function clearGames(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
