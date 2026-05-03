"use client";

import { customAlphabet } from "nanoid";
import { Chess } from "chess.js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomMove = Database["public"]["Tables"]["room_moves"]["Row"];

// 8 символов, без 0/O/1/I
const generateInviteCode = customAlphabet(
  "23456789abcdefghjkmnpqrstuvwxyz",
  8,
);

const INITIAL_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export interface CreateRoomParams {
  hostId: string;
  hostColor?: "white" | "black" | "random";
  timeControl?: string;
  initialMs?: number | null;
  incrementMs?: number;
}

export async function createRoom(params: CreateRoomParams): Promise<Room> {
  const supabase = getSupabaseClient();
  const inviteCode = generateInviteCode();

  const initialMs = params.initialMs ?? null;
  const incrementMs = params.incrementMs ?? 0;

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      invite_code: inviteCode,
      host_id: params.hostId,
      host_color: params.hostColor ?? "white",
      time_control: params.timeControl ?? "unlimited",
      current_fen: INITIAL_FEN,
      initial_ms: initialMs,
      increment_ms: incrementMs,
      white_clock_ms: initialMs,
      black_clock_ms: initialMs,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create room: ${error.message}`);
  return data;
}

export async function joinRoom(
  inviteCode: string,
  guestId: string,
): Promise<Room> {
  const supabase = getSupabaseClient();

  const { data: room, error: fetchError } = await supabase
    .from("rooms")
    .select()
    .eq("invite_code", inviteCode)
    .single();

  if (fetchError || !room) {
    throw new Error("Комната не найдена");
  }

  if (room.host_id === guestId) {
    return room;
  }

  if (room.guest_id && room.guest_id !== guestId) {
    throw new Error("Комната уже занята");
  }

  if (room.guest_id === guestId) {
    return room;
  }

  const { data: updated, error: updateError } = await supabase
    .from("rooms")
    .update({ guest_id: guestId, status: "active" })
    .eq("id", room.id)
    .select()
    .single();

  if (updateError) throw new Error(`Failed to join room: ${updateError.message}`);
  return updated;
}

export async function getRoomByInvite(
  inviteCode: string,
): Promise<Room | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("rooms")
    .select()
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function appendMove(params: {
  roomId: string;
  ply: number;
  uci: string;
  san: string;
  fenAfter: string;
  byUserId: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("room_moves")
    .insert({
      room_id: params.roomId,
      ply: params.ply,
      uci: params.uci,
      san: params.san,
      fen_after: params.fenAfter,
      by_user_id: params.byUserId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadRoomMoves(roomId: string): Promise<RoomMove[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("room_moves")
    .select()
    .eq("room_id", roomId)
    .order("ply", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function rebuildPgn(moves: { uci: string; san: string }[]): {
  pgn: string;
  fen: string;
} {
  const chess = new Chess();
  for (const m of moves) {
    try {
      chess.move({
        from: m.uci.slice(0, 2),
        to: m.uci.slice(2, 4),
        promotion: m.uci[4] as "q" | "r" | "b" | "n" | undefined,
      });
    } catch {
      break;
    }
  }
  return { pgn: chess.pgn(), fen: chess.fen() };
}
