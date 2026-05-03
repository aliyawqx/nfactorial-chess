"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  Flag,
  Handshake,
  Undo2,
  Cpu,
  Loader2,
} from "lucide-react";
import type { Square } from "chess.js";
import { nanoid } from "nanoid";
import { AppHeader } from "@/components/layout/AppHeader";
import { MoveHistory } from "@/components/chess/MoveHistory";
import { GameStatus } from "@/components/chess/GameStatus";
import { useChessGame } from "@/hooks/use-chess-game";
import { useStockfish } from "@/hooks/use-stockfish";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
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

type PlayerColor = "white" | "black";

const PRESETS = [
  { level: 1, movetime: 200, key: "levelBeginner" as const },
  { level: 5, movetime: 400, key: "levelCasual" as const },
  { level: 10, movetime: 800, key: "levelIntermediate" as const },
  { level: 14, movetime: 1200, key: "levelAdvanced" as const },
  { level: 18, movetime: 2000, key: "levelExpert" as const },
  { level: 20, movetime: 3000, key: "levelGM" as const },
];

export default function AiGamePage() {
  const { t } = useI18n();
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [presetIndex, setPresetIndex] = useState(2);
  const [thinking, setThinking] = useState(false);
  const preset = PRESETS[presetIndex];

  const { engine, ready: engineReady } = useStockfish();

  const startedAtRef = useRef<number>(Date.now());
  const savedRef = useRef(false);

  const handleGameOver = useCallback(
    (
      gameOver: GameOver,
      ctx: { pgn: string; fen: string; plyCount: number },
    ) => {
      if (savedRef.current) return;
      savedRef.current = true;
      const playerName = "Вы";
      const aiName = `Stockfish · ${t.ai[preset.key]}`;
      saveGame({
        id: nanoid(10),
        mode: "ai",
        whiteName: playerColor === "white" ? playerName : aiName,
        blackName: playerColor === "black" ? playerName : aiName,
        result: gameOver.result,
        termination: gameOver.termination,
        pgn: ctx.pgn,
        finalFen: ctx.fen,
        plyCount: ctx.plyCount,
        aiLevel: preset.level,
        startedAt: startedAtRef.current,
        finishedAt: Date.now(),
      });
    },
    [playerColor, preset.level, preset.key, t.ai],
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
    storageKey: `voicechess:ai-game:${playerColor}:${preset.level}`,
    onGameOver: handleGameOver,
  });

  const lastPlayedMove =
    history.length > 0
      ? {
          san: history[history.length - 1].san,
          color: history[history.length - 1].color as "w" | "b",
        }
      : null;

  const handleResetRef = useRef<() => void>(() => {});
  const handleVoiceCommand = useCallback(
    (cmd: VoiceCommand) => {
      switch (cmd) {
        case "newGame":
          handleResetRef.current();
          break;
        case "resign":
          if (!gameOver) resign(playerColor === "white" ? "w" : "b");
          break;
        case "offerDraw":
          if (!gameOver) agreeDraw();
          break;
        case "undo":
          if (history.length > 0 && !gameOver && !thinking) {
            undo();
            if (history.length >= 2) undo();
          }
          break;
        default:
          break;
      }
    },
    [agreeDraw, gameOver, history.length, playerColor, resign, thinking, undo],
  );

  const lastMove =
    history.length > 0
      ? {
          from: history[history.length - 1].from,
          to: history[history.length - 1].to,
        }
      : null;

  const isPlayerTurn =
    (turn === "w" && playerColor === "white") ||
    (turn === "b" && playerColor === "black");

  const askingRef = useRef(false);
  useEffect(() => {
    if (!engine || !engineReady || gameOver || isPlayerTurn || askingRef.current) {
      return;
    }
    askingRef.current = true;
    setThinking(true);
    engine.setSkillLevel(preset.level);
    engine
      .search({ fen, movetime: preset.movetime })
      .then((result) => {
        if (!result.bestmove || result.bestmove === "(none)") return;
        const from = result.bestmove.slice(0, 2) as Square;
        const to = result.bestmove.slice(2, 4) as Square;
        const promo = result.bestmove[4] as
          | "q"
          | "r"
          | "b"
          | "n"
          | undefined;
        makeMove({ from, to, promotion: promo });
      })
      .catch(() => {
        /* engine error */
      })
      .finally(() => {
        askingRef.current = false;
        setThinking(false);
      });
  }, [
    engine,
    engineReady,
    fen,
    gameOver,
    isPlayerTurn,
    makeMove,
    preset.level,
    preset.movetime,
  ]);

  const handleReset = useCallback(() => {
    if (history.length > 0 && !gameOver && !confirm(t.common.confirmReset)) return;
    reset();
    savedRef.current = false;
    startedAtRef.current = Date.now();
  }, [history.length, gameOver, reset, t.common.confirmReset]);

  handleResetRef.current = handleReset;

  const handleColorChange = useCallback(
    (color: PlayerColor) => {
      if (history.length > 0 && !gameOver && !confirm(t.common.confirmReset)) return;
      reset();
      savedRef.current = false;
      startedAtRef.current = Date.now();
      setPlayerColor(color);
    },
    [history.length, gameOver, reset, t.common.confirmReset],
  );

  const handleUndoTwo = useCallback(() => {
    if (history.length === 0) return;
    undo();
    if (history.length >= 2) undo();
  }, [history.length, undo]);

  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-4 sm:py-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                {t.ai.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Stockfish 18 · {t.ai.subtitle}
              </p>
            </div>
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              {!engineReady ? (
                <>
                  <Loader2
                    className="h-3 w-3 animate-spin"
                    aria-hidden="true"
                  />
                  {t.ai.loading}
                </>
              ) : (
                <>
                  <Cpu
                    className="h-3 w-3 text-emerald-500"
                    aria-hidden="true"
                  />
                  {t.ai.ready}
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <GameStatus turn={turn} inCheck={inCheck} gameOver={gameOver} />
              {thinking && !gameOver && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-2 text-sm text-muted-foreground"
                >
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  {t.ai.thinking}
                </div>
              )}
              <ChessBoard
                position={fen}
                onMove={(p) => (isPlayerTurn ? makeMove(p) : null)}
                legalMovesFrom={legalMovesFrom}
                lastMove={lastMove}
                inCheck={inCheck}
                gameOver={gameOver}
                orientation={playerColor}
                interactive={!gameOver && isPlayerTurn && engineReady}
              />
            </div>

            <aside className="flex flex-col gap-3 sm:gap-4">
              <VoiceController
                legalMoves={legalMoves}
                onMove={(p) =>
                  isPlayerTurn
                    ? makeMove({
                        from: p.from as never,
                        to: p.to as never,
                        promotion: p.promotion as never,
                      })
                    : null
                }
                onCommand={handleVoiceCommand}
                lastOpponentMove={lastPlayedMove}
              />

              <fieldset className="rounded-lg border bg-card p-3">
                <legend className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t.ai.level}
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p, i) => (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => setPresetIndex(i)}
                      aria-pressed={i === presetIndex}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-xs font-medium transition",
                        i === presetIndex
                          ? "bg-primary text-primary-foreground"
                          : "border bg-background hover:bg-secondary",
                      )}
                    >
                      {t.ai[p.key]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="rounded-lg border bg-card p-3">
                <legend className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t.ai.yourColor}
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(["white", "black"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(c)}
                      aria-pressed={c === playerColor}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-xs font-medium transition",
                        c === playerColor
                          ? "bg-primary text-primary-foreground"
                          : "border bg-background hover:bg-secondary",
                      )}
                    >
                      {c === "white" ? t.ai.colorWhite : t.ai.colorBlack}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndoTwo}
                  disabled={history.length === 0 || !!gameOver || thinking}
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
                  onClick={() => resign(playerColor === "white" ? "w" : "b")}
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

              <MoveHistory
                history={history}
                className="min-h-[300px] lg:min-h-[400px]"
              />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
