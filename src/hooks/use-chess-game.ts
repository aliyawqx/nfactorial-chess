"use client";

import { Chess, type Move, type Square } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameOver, PieceType, Termination } from "@/types/chess";

export interface GameOverContext {
  pgn: string;
  fen: string;
  plyCount: number;
}

export interface UseChessGameOptions {
  initialFen?: string;
  storageKey?: string;
  onMove?: (move: Move) => void;
  onGameOver?: (gameOver: GameOver, ctx: GameOverContext) => void;
}

export interface UseChessGameReturn {
  fen: string;
  pgn: string;
  history: Move[];
  turn: "w" | "b";
  inCheck: boolean;
  isGameOver: boolean;
  gameOver: GameOver | null;
  legalMoves: Move[];
  legalMovesFrom: (square: Square) => Move[];
  makeMove: (params: {
    from: Square;
    to: Square;
    promotion?: PieceType;
  }) => Move | null;
  undo: () => void;
  reset: (fen?: string) => void;
  resign: (color: "w" | "b") => void;
  agreeDraw: () => void;
}

function detectGameOver(chess: Chess): GameOver | null {
  if (!chess.isGameOver()) return null;

  let termination: Termination = "checkmate";
  if (chess.isCheckmate()) termination = "checkmate";
  else if (chess.isStalemate()) termination = "stalemate";
  else if (chess.isInsufficientMaterial()) termination = "insufficient_material";
  else if (chess.isThreefoldRepetition()) termination = "threefold";
  else if (chess.isDraw()) termination = "fifty_move";

  if (termination === "checkmate") {
    const winner = chess.turn() === "w" ? "b" : "w";
    return {
      result: winner === "w" ? "1-0" : "0-1",
      termination,
      winner,
    };
  }
  return { result: "1/2-1/2", termination };
}

export function useChessGame(
  options: UseChessGameOptions = {},
): UseChessGameReturn {
  const chessRef = useRef<Chess>(new Chess(options.initialFen));
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  // chess.js не знает про resignation/draw agreement — отдельный state
  const [manualGameOver, setManualGameOver] = useState<GameOver | null>(null);
  const onMoveRef = useRef(options.onMove);
  const onGameOverRef = useRef(options.onGameOver);
  const storageKeyRef = useRef(options.storageKey);
  onMoveRef.current = options.onMove;
  onGameOverRef.current = options.onGameOver;
  storageKeyRef.current = options.storageKey;

  const chess = chessRef.current;

  useEffect(() => {
    const key = storageKeyRef.current;
    if (!key || typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        const restored = new Chess();
        restored.loadPgn(saved);
        chessRef.current = restored;
        force((n) => n + 1);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(() => {
    const key = storageKeyRef.current;
    if (!key || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, chessRef.current.pgn());
    } catch {}
  }, []);

  const legalMoves = useMemo(() => chess.moves({ verbose: true }), [chess.fen()]); // eslint-disable-line react-hooks/exhaustive-deps

  const legalMovesFrom = useCallback(
    (square: Square) => chess.moves({ square, verbose: true }),
    [chess],
  );

  const buildCtx = useCallback((): GameOverContext => {
    const c = chessRef.current;
    return {
      pgn: c.pgn(),
      fen: c.fen(),
      plyCount: c.history().length,
    };
  }, []);

  const makeMove: UseChessGameReturn["makeMove"] = useCallback(
    ({ from, to, promotion }) => {
      if (manualGameOver) return null;
      try {
        const move = chessRef.current.move({
          from,
          to,
          promotion: promotion ?? "q",
        });
        if (!move) return null;
        rerender();
        persist();
        onMoveRef.current?.(move);
        const over = detectGameOver(chessRef.current);
        if (over) onGameOverRef.current?.(over, buildCtx());
        return move;
      } catch {
        return null;
      }
    },
    [rerender, persist, buildCtx, manualGameOver],
  );

  const undo = useCallback(() => {
    chessRef.current.undo();
    rerender();
    persist();
  }, [rerender, persist]);

  const reset = useCallback(
    (fen?: string) => {
      chessRef.current = new Chess(fen);
      setManualGameOver(null);
      rerender();
      const key = storageKeyRef.current;
      if (key && typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(key);
        } catch {}
      }
    },
    [rerender],
  );

  const resign = useCallback(
    (color: "w" | "b") => {
      const winner = color === "w" ? "b" : "w";
      const over: GameOver = {
        result: winner === "w" ? "1-0" : "0-1",
        termination: "resignation",
        winner,
      };
      setManualGameOver(over);
      onGameOverRef.current?.(over, buildCtx());
    },
    [buildCtx],
  );

  const agreeDraw = useCallback(() => {
    const over: GameOver = {
      result: "1/2-1/2",
      termination: "draw_agreed",
    };
    setManualGameOver(over);
    onGameOverRef.current?.(over, buildCtx());
  }, [buildCtx]);

  const computedGameOver = manualGameOver ?? detectGameOver(chess);

  return {
    fen: chess.fen(),
    pgn: chess.pgn(),
    history: chess.history({ verbose: true }) as Move[],
    turn: chess.turn(),
    inCheck: chess.inCheck(),
    isGameOver: chess.isGameOver() || manualGameOver !== null,
    gameOver: computedGameOver,
    legalMoves,
    legalMovesFrom,
    makeMove,
    undo,
    reset,
    resign,
    agreeDraw,
  };
}
