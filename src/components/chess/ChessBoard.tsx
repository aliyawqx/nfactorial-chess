"use client";

import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { Move } from "chess.js";
import { BoardA11yOverlay } from "./BoardA11yOverlay";
import { useAnnounce } from "@/components/a11y/LiveRegion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { describeMove, describeGameOver } from "@/lib/chess/announce";
import type { GameOver } from "@/types/chess";

interface ChessBoardProps {
  position: string;
  onMove: (params: { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" }) => Move | null;
  legalMovesFrom: (square: Square) => Move[];
  orientation?: "white" | "black";
  lastMove?: { from: Square; to: Square } | null;
  inCheck?: boolean;
  kingSquare?: Square | null;
  interactive?: boolean;
  gameOver?: GameOver | null;
}

const lightSquareStyle: CSSProperties = {
  background: "hsl(var(--board-light))",
};
const darkSquareStyle: CSSProperties = {
  background: "hsl(var(--board-dark))",
};

export function ChessBoard({
  position,
  onMove,
  legalMovesFrom,
  orientation = "white",
  lastMove,
  inCheck,
  kingSquare,
  interactive = true,
  gameOver,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [hoverSquare, setHoverSquare] = useState<Square | null>(null);
  const announce = useAnnounce();
  const { t } = useI18n();
  const lastAnnouncedFenRef = useRef<string>("");

  const tryMove = useCallback(
    (from: Square, to: Square): boolean => {
      const result = onMove({ from, to });
      if (result) {
        setSelected(null);
        announce(describeMove(result, t.a11y));
        return true;
      }
      return false;
    },
    [onMove, announce, t.a11y],
  );

  // Announce check / game over
  useEffect(() => {
    if (lastAnnouncedFenRef.current === position) return;
    lastAnnouncedFenRef.current = position;
    if (gameOver) {
      announce(describeGameOver(gameOver, t.a11y), true);
    } else if (inCheck) {
      announce(t.a11y.checkAnnounced, true);
    }
  }, [position, inCheck, gameOver, announce, t.a11y]);

  const handleSquareClick = useCallback(
    ({ square }: { square: string }) => {
      if (!interactive) return;
      const sq = square as Square;
      if (!selected) {
        const moves = legalMovesFrom(sq);
        if (moves.length > 0) setSelected(sq);
        return;
      }
      if (selected === sq) {
        setSelected(null);
        return;
      }
      const moved = tryMove(selected, sq);
      if (!moved) {
        const moves = legalMovesFrom(sq);
        if (moves.length > 0) setSelected(sq);
        else setSelected(null);
      }
    },
    [interactive, legalMovesFrom, selected, tryMove],
  );

  const handlePieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!interactive || !targetSquare) return false;
      const ok = tryMove(sourceSquare as Square, targetSquare as Square);
      return ok;
    },
    [interactive, tryMove],
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = {
        background: "hsl(var(--board-last-move) / 0.55)",
      };
      styles[lastMove.to] = {
        background: "hsl(var(--board-last-move) / 0.55)",
      };
    }

    if (inCheck && kingSquare) {
      styles[kingSquare] = {
        background:
          "radial-gradient(circle, hsl(var(--board-check) / 0.85) 0%, transparent 70%)",
      };
    }

    if (selected) {
      styles[selected] = {
        background: "hsl(var(--board-light-selected) / 0.7)",
      };
      const moves = legalMovesFrom(selected);
      for (const m of moves) {
        const isCapture = !!m.captured;
        styles[m.to] = {
          ...(styles[m.to] ?? {}),
          background: isCapture
            ? "radial-gradient(circle, transparent 60%, hsl(var(--board-move-target) / 0.55) 62%, hsl(var(--board-move-target) / 0.55) 70%, transparent 72%)"
            : "radial-gradient(circle, hsl(var(--board-move-target) / 0.55) 22%, transparent 24%)",
        };
      }
    }

    if (hoverSquare && selected && hoverSquare !== selected) {
      styles[hoverSquare] = {
        ...(styles[hoverSquare] ?? {}),
        outline: "2px solid hsl(var(--ring) / 0.5)",
        outlineOffset: "-2px",
      };
    }

    return styles;
  }, [hoverSquare, inCheck, kingSquare, lastMove, legalMovesFrom, selected]);

  return (
    <div className="relative aspect-square w-full max-w-[min(90vh,640px)] mx-auto">
      <Chessboard
        options={{
          id: "voicechess-main",
          position,
          boardOrientation: orientation,
          showAnimations: true,
          animationDurationInMs: 200,
          allowDragging: interactive,
          allowDrawingArrows: false,
          showNotation: true,
          lightSquareStyle,
          darkSquareStyle,
          squareStyles,
          onSquareClick: handleSquareClick,
          onPieceDrop: handlePieceDrop,
          onMouseOverSquare: ({ square }) => setHoverSquare(square as Square),
          onMouseOutSquare: () => setHoverSquare(null),
        }}
      />
      <BoardA11yOverlay
        fen={position}
        orientation={orientation}
        selected={selected}
        onSelect={setSelected}
        onMove={(from, to) => tryMove(from, to)}
        active={interactive}
      />
    </div>
  );
}
