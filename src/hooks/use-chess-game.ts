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
    } catch {
      /* ignore corrupted save */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(() => {
    const key = storageKeyRef.current;
    if (!key || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, chessRef.current.pgn());
    } catch {
      /* quota exceeded — silent */
    }
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
    [rerender, persist, buildCtx],
  );

  const undo = useCallback(() => {
    chessRef.current.undo();
    rerender();
    persist();
  }, [rerender, persist]);

  const reset = useCallback(
    (fen?: string) => {
      chessRef.current = new Chess(fen);
      rerender();
      const key = storageKeyRef.current;
      if (key && typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    },
    [rerender],
  );

  const resign = useCallback(
    (color: "w" | "b") => {
      const winner = color === "w" ? "b" : "w";
      onGameOverRef.current?.(
        {
          result: winner === "w" ? "1-0" : "0-1",
          termination: "resignation",
          winner,
        },
        buildCtx(),
      );
      rerender();
    },
    [rerender, buildCtx],
  );

  const agreeDraw = useCallback(() => {
    onGameOverRef.current?.(
      {
        result: "1/2-1/2",
        termination: "draw_agreed",
      },
      buildCtx(),
    );
    rerender();
  }, [rerender, buildCtx]);

  return {
    fen: chess.fen(),
    pgn: chess.pgn(),
    history: chess.history({ verbose: true }) as Move[],
    turn: chess.turn(),
    inCheck: chess.inCheck(),
    isGameOver: chess.isGameOver(),
    gameOver: detectGameOver(chess),
    legalMoves,
    legalMovesFrom,
    makeMove,
    undo,
    reset,
    resign,
    agreeDraw,
  };
}
