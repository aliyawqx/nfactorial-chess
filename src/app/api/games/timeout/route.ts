import { NextResponse } from "next/server";
import { Chess } from "chess.js";
import { getSupabaseService } from "@/lib/supabase/service";
import { applyGameResult, DEFAULT_ELO } from "@/lib/chess/elo";

export const runtime = "nodejs";

interface TimeoutBody {
  roomId: string;
}

export async function POST(request: Request) {
  let body: TimeoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  const supabase = getSupabaseService();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select()
    .eq("id", body.roomId)
    .single();
  if (roomErr || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  console.log(`[timeout-api] roomId=${body.roomId} status=${room.status} initial_ms=${room.initial_ms}`);
  if (room.status === "finished") {
    return NextResponse.json({ ok: true, alreadyFinished: true });
  }
  if (room.initial_ms == null) {
    return NextResponse.json(
      { error: "Untimed room (миграция 00003 не запущена?)" },
      { status: 400 },
    );
  }

  // server-side проверка: реально ли вышло время у того кто сейчас ходит
  const { data: moves } = await supabase
    .from("room_moves")
    .select()
    .eq("room_id", body.roomId)
    .order("ply", { ascending: true });

  const chess = new Chess();
  for (const m of moves ?? []) {
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
  const turn = chess.turn();
  const clock = turn === "w" ? room.white_clock_ms : room.black_clock_ms;
  if (clock == null) {
    console.warn("[timeout-api] clock is null", { white: room.white_clock_ms, black: room.black_clock_ms });
    return NextResponse.json({ error: "No clock" }, { status: 400 });
  }
  const startedAt = room.last_move_at
    ? new Date(room.last_move_at).getTime()
    : new Date(room.created_at).getTime();
  const elapsed = Date.now() - startedAt;
  console.log(`[timeout-api] turn=${turn} clock=${clock} elapsed=${elapsed}`);
  if (elapsed < clock) {
    return NextResponse.json({ error: "Time not up" }, { status: 400 });
  }

  // выиграл соперник того кто просрочил
  const winner: "w" | "b" = turn === "w" ? "b" : "w";
  const result: "1-0" | "0-1" = winner === "w" ? "1-0" : "0-1";

  const playerIds = [room.host_id, room.guest_id].filter(
    (id): id is string => !!id,
  );
  const { data: profilesArr } = await supabase
    .from("profiles")
    .select("id, display_name, elo")
    .in("id", playerIds);
  const profiles = new Map(
    (profilesArr ?? []).map((p) => [p.id, p as { id: string; display_name: string | null; elo: number }]),
  );

  const whiteId = room.host_color === "white" ? room.host_id : room.guest_id;
  const blackId = room.host_color === "white" ? room.guest_id : room.host_id;
  const whiteProfile = whiteId ? profiles.get(whiteId) : null;
  const blackProfile = blackId ? profiles.get(blackId) : null;
  const whiteName = whiteProfile?.display_name ?? "Гость";
  const blackName = blackProfile?.display_name ?? "Гость";
  const whiteElo = whiteProfile?.elo ?? DEFAULT_ELO;
  const blackElo = blackProfile?.elo ?? DEFAULT_ELO;

  const eloChange = applyGameResult({ whiteElo, blackElo, result });

  await supabase.from("games").insert({
    mode: "online",
    white_id: whiteId ?? null,
    black_id: blackId ?? null,
    white_name: whiteName,
    black_name: blackName,
    pgn: chess.pgn(),
    final_fen: chess.fen(),
    result,
    termination: "timeout",
    ply_count: chess.history().length,
    room_id: body.roomId,
    finished_at: new Date().toISOString(),
  });

  if (whiteId) {
    await supabase
      .from("profiles")
      .update({ elo: eloChange.whiteAfter })
      .eq("id", whiteId);
  }
  if (blackId) {
    await supabase
      .from("profiles")
      .update({ elo: eloChange.blackAfter })
      .eq("id", blackId);
  }

  // фиксируем clock=0 у того кто просрочил, чтобы UI остался на нуле
  const roomUpdate: {
    status: "finished";
    white_clock_ms?: number;
    black_clock_ms?: number;
  } = { status: "finished" };
  if (turn === "w") {
    roomUpdate.white_clock_ms = 0;
  } else {
    roomUpdate.black_clock_ms = 0;
  }
  await supabase
    .from("rooms")
    .update(roomUpdate)
    .eq("id", body.roomId);

  await supabase.rpc("refresh_leaderboard").then(() => null, () => null);

  return NextResponse.json({ ok: true, result, termination: "timeout" });
}
