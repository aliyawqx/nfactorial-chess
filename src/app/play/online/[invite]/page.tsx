"use client";

import { use, useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Chess, type Square } from "chess.js";
import { Copy, Check, Loader2, Users, Flag, Handshake } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { MoveHistory } from "@/components/chess/MoveHistory";
import { GameStatus } from "@/components/chess/GameStatus";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";
import { joinRoom, appendMove } from "@/lib/multiplayer/room";
import { VoiceController } from "@/components/voice/VoiceController";
import type { GameOver } from "@/types/chess";
import type { VoiceCommand } from "@/lib/voice/parser/types";

const ChessBoard = dynamic(
  () => import("@/components/chess/ChessBoard").then((m) => m.ChessBoard),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full max-w-[min(90vh,640px)] mx-auto animate-pulse rounded-lg bg-secondary" />
    ),
  },
);

interface PageProps {
  params: Promise<{ invite: string }>;
}

export default function OnlineGamePage({ params }: PageProps) {
  const { invite } = use(params);
  const { t } = useI18n();
  const { user, configured, ensureSignedIn } = useSupabaseUser();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localGameOver, setLocalGameOver] = useState<GameOver | null>(null);

  // Авто-вход + auto-join по invite_code при mount
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      try {
        const u = user ?? (await ensureSignedIn());
        if (!u || cancelled) return;
        const room = await joinRoom(invite, u.id);
        if (!cancelled) setRoomId(room.id);
      } catch (e) {
        if (!cancelled) setJoinError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, invite, user, ensureSignedIn]);

  const { room, moves, loading } = useRealtimeRoom(roomId);

  // Восстанавливаем chess.js из room_moves
  const chessState = useMemo(() => {
    const c = new Chess();
    for (const m of moves) {
      try {
        c.move({
          from: m.uci.slice(0, 2),
          to: m.uci.slice(2, 4),
          promotion: m.uci[4] as "q" | "r" | "b" | "n" | undefined,
        });
      } catch {
        break;
      }
    }
    return c;
  }, [moves]);

  // Вычисляем мою роль и цвет
  const myColor: "w" | "b" | null = useMemo(() => {
    if (!room || !user) return null;
    if (room.host_id === user.id) {
      return room.host_color === "black" ? "b" : "w";
    }
    if (room.guest_id === user.id) {
      return room.host_color === "black" ? "w" : "b";
    }
    return null;
  }, [room, user]);

  const isMyTurn = myColor !== null && chessState.turn() === myColor;
  const orientation: "white" | "black" = myColor === "b" ? "black" : "white";
  const inCheck = chessState.inCheck();
  const fen = chessState.fen();
  const history = chessState.history({ verbose: true });

  const isWaiting = room?.status === "waiting";

  const detectGameOver = (c: Chess): GameOver | null => {
    if (!c.isGameOver()) return null;
    if (c.isCheckmate()) {
      const winner = c.turn() === "w" ? "b" : "w";
      return {
        result: winner === "w" ? "1-0" : "0-1",
        termination: "checkmate",
        winner,
      };
    }
    if (c.isStalemate()) return { result: "1/2-1/2", termination: "stalemate" };
    if (c.isInsufficientMaterial())
      return { result: "1/2-1/2", termination: "insufficient_material" };
    if (c.isThreefoldRepetition())
      return { result: "1/2-1/2", termination: "threefold" };
    if (c.isDraw()) return { result: "1/2-1/2", termination: "fifty_move" };
    return null;
  };

  const gameOver = localGameOver ?? detectGameOver(chessState);

  const handleMove = useCallback(
    (params: { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" }) => {
      if (!room || !user || !roomId) return null;
      if (!isMyTurn) return null;
      if (gameOver) return null;

      // Локально валидируем
      const tester = new Chess(fen);
      let move;
      try {
        move = tester.move({
          from: params.from,
          to: params.to,
          promotion: params.promotion ?? "q",
        });
      } catch {
        return null;
      }
      if (!move) return null;

      const ply = moves.length + 1;
      const uci =
        move.from + move.to + (move.promotion ?? "");
      const san = move.san;
      const fenAfter = tester.fen();

      // Отправляем на сервер. Не дожидаемся ответа — Realtime подтянет.
      appendMove({
        roomId,
        ply,
        uci,
        san,
        fenAfter,
        byUserId: user.id,
      }).catch((e) => {
        console.error("appendMove failed:", e);
      });

      return move;
    },
    [room, user, roomId, isMyTurn, fen, moves.length, gameOver],
  );

  const legalMovesFrom = useCallback(
    (square: Square) => {
      try {
        return chessState.moves({ square, verbose: true });
      } catch {
        return [];
      }
    },
    [chessState],
  );

  const lastMove =
    history.length > 0
      ? {
          from: history[history.length - 1].from as Square,
          to: history[history.length - 1].to as Square,
        }
      : null;

  // Озвучиваем все ходы (и свои, и оппонента)
  const lastPlayedMove =
    history.length > 0
      ? {
          san: history[history.length - 1].san,
          color: history[history.length - 1].color as "w" | "b",
        }
      : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const handleResign = () => {
    if (!myColor || gameOver) return;
    const winner = myColor === "w" ? "b" : "w";
    setLocalGameOver({
      result: winner === "w" ? "1-0" : "0-1",
      termination: "resignation",
      winner,
    });
  };

  const handleAgreeDraw = () => {
    if (gameOver) return;
    setLocalGameOver({ result: "1/2-1/2", termination: "draw_agreed" });
  };

  const handleVoiceCommand = useCallback(
    (cmd: VoiceCommand) => {
      switch (cmd) {
        case "resign":
          handleResign();
          break;
        case "offerDraw":
          handleAgreeDraw();
          break;
        default:
          break;
      }
    },
    [],
  );

  if (!configured) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
            <p className="text-muted-foreground">{t.online.configureSupabase}</p>
          </div>
        </main>
      </>
    );
  }

  if (joinError) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="container mx-auto max-w-md px-4 py-12 text-center">
            <h1 className="mb-3 text-xl font-semibold">{t.online.roomNotFound}</h1>
            <p className="mb-6 text-sm text-muted-foreground">{joinError}</p>
            <a
              href="/play/online"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {t.online.back}
            </a>
          </div>
        </main>
      </>
    );
  }

  if (loading || !room) {
    return (
      <>
        <AppHeader />
        <main id="main" className="flex-1">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-4 sm:py-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {t.online.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t.online.inviteCode}: <span className="font-mono">{room.invite_code}</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? t.online.copied : t.online.copy}
            </Button>
          </div>

          {isWaiting && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-2 text-sm text-muted-foreground"
            >
              <Users className="h-4 w-4 animate-pulse" aria-hidden="true" />
              {t.online.waiting}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <GameStatus
                turn={chessState.turn()}
                inCheck={inCheck}
                gameOver={gameOver}
              />
              <ChessBoard
                position={fen}
                onMove={(p) => handleMove(p as { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" })}
                legalMovesFrom={legalMovesFrom}
                lastMove={lastMove}
                inCheck={inCheck}
                gameOver={gameOver}
                orientation={orientation}
                interactive={!gameOver && isMyTurn && !isWaiting}
              />
            </div>

            <aside className="flex flex-col gap-3 sm:gap-4">
              <VoiceController
                legalMoves={chessState.moves({ verbose: true })}
                onMove={(p) =>
                  isMyTurn
                    ? handleMove(p as { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" })
                    : null
                }
                onCommand={handleVoiceCommand}
                lastOpponentMove={lastPlayedMove}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResign}
                  disabled={!!gameOver || isWaiting}
                  aria-label={t.game.buttonResignAria}
                >
                  <Flag className="h-4 w-4" aria-hidden="true" />
                  {t.common.resign}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAgreeDraw}
                  disabled={!!gameOver || isWaiting}
                  aria-label={t.game.buttonDrawAria}
                >
                  <Handshake className="h-4 w-4" aria-hidden="true" />
                  {t.common.offerDraw}
                </Button>
              </div>

              <MoveHistory history={history} className="min-h-[300px] lg:min-h-[400px]" />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
