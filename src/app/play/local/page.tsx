"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { RotateCcw, Flag, Handshake, Undo2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { MoveHistory } from "@/components/chess/MoveHistory";
import { GameStatus } from "@/components/chess/GameStatus";
import { useChessGame } from "@/hooks/use-chess-game";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/I18nProvider";
import { saveGame } from "@/lib/games-storage";
import type { GameOver } from "@/types/chess";
import { VoiceController } from "@/components/voice/VoiceController";
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

export default function LocalGamePage() {
  const t = useT();
  const startedAtRef = useRef<number>(Date.now());
  const savedRef = useRef(false);

  const handleGameOver = useCallback(
    (gameOver: GameOver, ctx: { pgn: string; fen: string; plyCount: number }) => {
      if (savedRef.current) return;
      savedRef.current = true;
      saveGame({
        id: nanoid(10),
        mode: "local",
        whiteName: "Игрок 1",
        blackName: "Игрок 2",
        result: gameOver.result,
        termination: gameOver.termination,
        pgn: ctx.pgn,
        finalFen: ctx.fen,
        plyCount: ctx.plyCount,
        startedAt: startedAtRef.current,
        finishedAt: Date.now(),
      });
    },
    [],
  );

  const {
    fen,
    history,
    turn,
    inCheck,
    gameOver,
    legalMoves,
    legalMovesFrom,
    makeMove,
    undo,
    reset,
    resign,
    agreeDraw,
  } = useChessGame({
    storageKey: "voicechess:local-game",
    onGameOver: handleGameOver,
  });

  const handleVoiceCommand = useCallback(
    (cmd: VoiceCommand) => {
      switch (cmd) {
        case "newGame":
          handleResetRef.current();
          break;
        case "resign":
          if (!gameOver) resign(turn);
          break;
        case "offerDraw":
          if (!gameOver) agreeDraw();
          break;
        case "undo":
          if (history.length > 0 && !gameOver) undo();
          break;
        default:
          break;
      }
    },
    [agreeDraw, gameOver, history.length, resign, turn, undo],
  );

  const handleResetRef = useRef<() => void>(() => {});

  const lastMove =
    history.length > 0
      ? {
          from: history[history.length - 1].from,
          to: history[history.length - 1].to,
        }
      : null;

  const handleReset = useCallback(() => {
    if (history.length > 0 && !gameOver && !confirm(t.common.confirmReset)) {
      return;
    }
    reset();
    savedRef.current = false;
    startedAtRef.current = Date.now();
  }, [history.length, gameOver, reset, t.common.confirmReset]);

  handleResetRef.current = handleReset;

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-4 sm:py-6">
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {t.game.localTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.game.localDescription}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <GameStatus turn={turn} inCheck={inCheck} gameOver={gameOver} />
              <ChessBoard
                position={fen}
                onMove={(p) => makeMove(p)}
                legalMovesFrom={legalMovesFrom}
                lastMove={lastMove}
                inCheck={inCheck}
                gameOver={gameOver}
                interactive={!gameOver}
              />
            </div>

            <aside className="flex flex-col gap-3 sm:gap-4">
              <VoiceController
                legalMoves={legalMoves}
                onMove={(p) =>
                  makeMove({
                    from: p.from as never,
                    to: p.to as never,
                    promotion: p.promotion as never,
                  })
                }
                onCommand={handleVoiceCommand}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={history.length === 0 || !!gameOver}
                  aria-label={t.game.buttonUndoAria}
                >
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  {t.common.back}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  aria-label={t.game.buttonResetAria}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t.common.newGame}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resign(turn)}
                  disabled={!!gameOver}
                  aria-label={t.game.buttonResignAria}
                >
                  <Flag className="h-4 w-4" aria-hidden="true" />
                  {t.common.resign}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={agreeDraw}
                  disabled={!!gameOver}
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
