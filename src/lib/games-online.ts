"use client";

import { getSupabaseClient } from "@/lib/supabase/client";
import type { SavedGame } from "./games-storage";

/**
 * Загрузка онлайн-партий из Supabase для текущего пользователя.
 * Возвращает партии в едином формате SavedGame чтобы /games страница
 * могла объединить их с локальными.
 */
export async function loadOnlineGames(userId: string): Promise<SavedGame[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("games")
    .select()
    .or(`white_id.eq.${userId},black_id.eq.${userId}`)
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    mode: row.mode,
    whiteName: row.white_name,
    blackName: row.black_name,
    result: row.result,
    termination: (row.termination ?? "checkmate") as SavedGame["termination"],
    pgn: row.pgn,
    finalFen: row.final_fen ?? "",
    plyCount: row.ply_count,
    aiLevel: undefined,
    startedAt: new Date(row.created_at).getTime(),
    finishedAt: new Date(row.finished_at ?? row.created_at).getTime(),
  }));
}

export async function getOnlineGame(id: string): Promise<SavedGame | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("games")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    mode: data.mode,
    whiteName: data.white_name,
    blackName: data.black_name,
    result: data.result,
    termination: (data.termination ?? "checkmate") as SavedGame["termination"],
    pgn: data.pgn,
    finalFen: data.final_fen ?? "",
    plyCount: data.ply_count,
    aiLevel: undefined,
    startedAt: new Date(data.created_at).getTime(),
    finishedAt: new Date(data.finished_at ?? data.created_at).getTime(),
  };
}
