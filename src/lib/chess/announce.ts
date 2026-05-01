"use client";

import { Chess, type Square, type Move } from "chess.js";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { GameOver } from "@/types/chess";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export const ALL_SQUARES: Square[] = [];
for (let r = 7; r >= 0; r--) {
  for (let f = 0; f < 8; f++) {
    ALL_SQUARES.push(`${FILES[f]}${RANKS[r]}` as Square);
  }
}

function format(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export function describeSquare(
  chess: Chess,
  square: Square,
  d: Dictionary["a11y"],
): string {
  const piece = chess.get(square);
  if (!piece) {
    return format(d.emptySquare, { square });
  }
  return format(d.occupiedSquare, {
    square,
    color: piece.color === "w" ? d.pieceWhite : d.pieceBlack,
    piece: d.pieces[piece.type],
  });
}

export function describeMove(move: Move, d: Dictionary["a11y"]): string {
  const tpl = move.color === "w" ? d.whiteMoved : d.blackMoved;
  return format(tpl, { san: move.san });
}

export function describeGameOver(
  gameOver: GameOver,
  d: Dictionary["a11y"],
): string {
  if (gameOver.termination === "checkmate" && gameOver.winner) {
    return format(d.checkmateAnnounced, {
      winner: gameOver.winner === "w" ? d.whiteWinner : d.blackWinner,
    });
  }
  if (gameOver.termination === "stalemate") {
    return d.stalemateAnnounced;
  }
  return d.drawAnnounced;
}

export function listMovesFrom(
  chess: Chess,
  from: Square,
  d: Dictionary["a11y"],
): string {
  const moves = chess.moves({ square: from, verbose: true }) as Move[];
  if (moves.length === 0) {
    return format(d.noMoves, { square: from });
  }
  return format(d.availableMoves, {
    from,
    moves: moves.map((m) => m.san).join(", "),
  });
}
