"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type RoomMove = Database["public"]["Tables"]["room_moves"]["Row"];

export interface UseRealtimeRoomReturn {
  room: Room | null;
  moves: RoomMove[];
  loading: boolean;
  error: string | null;
}

export function useRealtimeRoom(roomId: string | null): UseRealtimeRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [moves, setMoves] = useState<RoomMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    const id: string = roomId;
    const supabase = getSupabaseClient();
    let cancelled = false;

    async function load() {
      try {
        const [roomRes, movesRes] = await Promise.all([
          supabase.from("rooms").select().eq("id", id).single(),
          supabase
            .from("room_moves")
            .select()
            .eq("room_id", id)
            .order("ply", { ascending: true }),
        ]);
        if (cancelled) return;
        if (roomRes.error) throw new Error(roomRes.error.message);
        setRoom(roomRes.data);
        setMoves(movesRes.data ?? []);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Ошибка загрузки комнаты");
          setLoading(false);
        }
      }
    }
    load();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (cancelled) return;
          if (payload.eventType === "UPDATE") {
            setRoom(payload.new as Room);
          } else if (payload.eventType === "DELETE") {
            setRoom(null);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_moves",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (cancelled) return;
          const newMove = payload.new as RoomMove;
          setMoves((prev) => {
            // idempotent по ply
            if (prev.some((m) => m.ply === newMove.ply)) return prev;
            return [...prev, newMove].sort((a, b) => a.ply - b.ply);
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId]);

  return { room, moves, loading, error };
}
