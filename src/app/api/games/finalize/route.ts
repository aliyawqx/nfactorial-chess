import { NextResponse } from "next/server";
import { Chess } from "chess.js";
import { getSupabaseService } from "@/lib/supabase/service";
import { applyGameResult, DEFAULT_ELO } from "@/lib/chess/elo";

export const runtime = "nodejs";

interface FinalizeBody {
  roomId: string;
  result: "1-0" | "0-1" | "1/2-1/2";
  termination?: string;
}

export async function POST(request: Request) {
  let body: FinalizeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.roomId || !body.result) {
    return NextResponse.json(
      { error: "roomId and result are required" },
      { status: 400 },
    );
  }
  if (!["1-0", "0-1", "1/2-1/2"].includes(body.result)) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const supabase = getSupabaseService();

  // idempotent: если room.status уже finished — early return
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select()
    .eq("id", body.roomId)
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.status === "finished") {
    return NextResponse.json({ ok: true, alreadyFinished: true });
  }

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
  const pgn = chess.pgn();
  const finalFen = chess.fen();
  const plyCount = chess.history().length;

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

  const whiteId =
    room.host_color === "white" ? room.host_id : room.guest_id;
  const blackId =
    room.host_color === "white" ? room.guest_id : room.host_id;

  const whiteProfile = whiteId ? profiles.get(whiteId) : null;
  const blackProfile = blackId ? profiles.get(blackId) : null;

  const whiteName = whiteProfile?.display_name ?? "Гость";
  const blackName = blackProfile?.display_name ?? "Гость";
  const whiteElo = whiteProfile?.elo ?? DEFAULT_ELO;
  const blackElo = blackProfile?.elo ?? DEFAULT_ELO;

  const eloChange = applyGameResult({
    whiteElo,
    blackElo,
    result: body.result,
  });

  const { data: gameInserted, error: gameErr } = await supabase
    .from("games")
    .insert({
      mode: "online",
      white_id: whiteId ?? null,
      black_id: blackId ?? null,
      white_name: whiteName,
      black_name: blackName,
      pgn,
      final_fen: finalFen,
      result: body.result,
      termination: body.termination ?? null,
      ply_count: plyCount,
      room_id: body.roomId,
      finished_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (gameErr) {
    return NextResponse.json(
      { error: `Failed to insert game: ${gameErr.message}` },
      { status: 500 },
    );
  }

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

  await supabase
    .from("rooms")
    .update({ status: "finished" })
    .eq("id", body.roomId);

  // best-effort
  await supabase.rpc("refresh_leaderboard").then(
    () => null,
    () => null,
  );

  return NextResponse.json({
    ok: true,
    gameId: gameInserted.id,
    eloChange: {
      white: { before: whiteElo, after: eloChange.whiteAfter, delta: eloChange.whiteDelta },
      black: { before: blackElo, after: eloChange.blackAfter, delta: eloChange.blackDelta },
    },
  });
}
