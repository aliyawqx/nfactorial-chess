"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Chess, type Square } from "chess.js";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAnnounce } from "@/components/a11y/LiveRegion";
import { ALL_SQUARES, describeSquare, listMovesFrom } from "@/lib/chess/announce";

interface BoardA11yOverlayProps {
  fen: string;
  orientation?: "white" | "black";
  selected: Square | null;
  onSelect: (square: Square | null) => void;
  onMove: (from: Square, to: Square) => boolean;
  active: boolean;
}

export function BoardA11yOverlay({
  fen,
  orientation = "white",
  selected,
  onSelect,
  onMove,
  active,
}: BoardA11yOverlayProps) {
  const { t } = useI18n();
  const announce = useAnnounce();
  const [focused, setFocused] = useState<Square>("e2");
  const containerRef = useRef<HTMLDivElement>(null);

  const chess = useMemo(() => {
    const c = new Chess();
    try {
      c.load(fen);
    } catch {
      /* invalid fen */
    }
    return c;
  }, [fen]);

  const squares = useMemo(() => {
    return orientation === "white" ? ALL_SQUARES : [...ALL_SQUARES].reverse();
  }, [orientation]);

  const moveFocus = (square: Square) => {
    setFocused(square);
    const el = containerRef.current?.querySelector<HTMLDivElement>(
      `[data-a11y-square="${square}"]`,
    );
    el?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, square: Square) => {
    const file = square.charCodeAt(0) - 97; // 0-7
    const rank = parseInt(square[1], 10) - 1; // 0-7
    let nextFile = file;
    let nextRank = rank;
    const dir = orientation === "white" ? 1 : -1;

    switch (e.key) {
      case "ArrowUp":
        nextRank = rank + dir;
        break;
      case "ArrowDown":
        nextRank = rank - dir;
        break;
      case "ArrowLeft":
        nextFile = file - dir;
        break;
      case "ArrowRight":
        nextFile = file + dir;
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        if (!selected) {
          const moves = chess.moves({ square, verbose: true });
          if (moves.length > 0) {
            onSelect(square);
            announce(
              `${t.a11y.selected.replace("{square}", square).replace("{piece}", describeSquare(chess, square, t.a11y))}`,
            );
          } else {
            announce(t.a11y.noMoves.replace("{square}", square));
          }
          return;
        }
        if (selected === square) {
          onSelect(null);
          announce(t.a11y.cancelled);
          return;
        }
        const ok = onMove(selected, square);
        if (!ok) {
          announce(
            t.a11y.illegal.replace("{from}", selected).replace("{to}", square),
            true,
          );
        }
        return;
      }
      case "Escape":
        if (selected) {
          onSelect(null);
          announce(t.a11y.cancelled);
        }
        return;
      case "m":
      case "M":
        announce(listMovesFrom(chess, square, t.a11y));
        return;
      case "?":
        announce(t.a11y.keyboardHelp, true);
        return;
      default:
        // a-h jump to file, 1-8 jump to rank
        if (/^[a-h]$/i.test(e.key)) {
          const newFile = e.key.toLowerCase().charCodeAt(0) - 97;
          moveFocus(`${String.fromCharCode(97 + newFile)}${rank + 1}` as Square);
          return;
        }
        if (/^[1-8]$/.test(e.key)) {
          const newRank = parseInt(e.key, 10) - 1;
          moveFocus(`${String.fromCharCode(97 + file)}${newRank + 1}` as Square);
          return;
        }
        return;
    }

    if (nextFile < 0 || nextFile > 7 || nextRank < 0 || nextRank > 7) return;
    e.preventDefault();
    moveFocus(`${String.fromCharCode(97 + nextFile)}${nextRank + 1}` as Square);
  };

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current?.querySelector<HTMLDivElement>(
      `[data-a11y-square="${focused}"]`,
    );
    if (el && document.activeElement === el) {
      // aria-label прочитается ридером при focus
    }
  }, [focused, active]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-label={t.a11y.boardLabel}
      aria-rowcount={8}
      aria-colcount={8}
      className="absolute inset-0 grid grid-cols-8 grid-rows-8"
      style={{ pointerEvents: "none" }}
    >
      {squares.map((sq) => {
        const isFocused = focused === sq;
        const isSelected = selected === sq;
        const piece = chess.get(sq);
        const label = piece
          ? `${sq}, ${piece.color === "w" ? t.a11y.pieceWhite : t.a11y.pieceBlack} ${t.a11y.pieces[piece.type]}`
          : `${sq}, ${t.a11y.emptySquare.split(",")[1].trim()}`;
        return (
          <div
            key={sq}
            role="gridcell"
            data-a11y-square={sq}
            tabIndex={isFocused ? 0 : -1}
            aria-label={label}
            aria-selected={isSelected}
            onKeyDown={(e) => handleKeyDown(e, sq)}
            onFocus={() => setFocused(sq)}
            className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            style={{ pointerEvents: "none", background: "transparent" }}
          />
        );
      })}
    </div>
  );
}
