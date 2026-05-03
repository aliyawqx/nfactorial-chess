import type { Move, Square } from "chess.js";
import type { ParsedVoiceInput } from "./types";

export type DisambigResult =
  | { status: "ok"; move: Move }
  | { status: "ambiguous"; candidates: Move[] }
  | { status: "illegal" }
  | { status: "no-move" };

export function disambiguate(
  parsed: ParsedVoiceInput,
  legalMoves: Move[],
): DisambigResult {
  if (parsed.kind === "castle") {
    const candidate = legalMoves.find((m) => {
      if (m.piece !== "k") return false;
      const fromFile = m.from.charCodeAt(0);
      const toFile = m.to.charCodeAt(0);
      const dx = toFile - fromFile;
      if (parsed.side === "kingside") return dx === 2;
      return dx === -2;
    });
    return candidate ? { status: "ok", move: candidate } : { status: "illegal" };
  }

  if (parsed.kind !== "move") {
    return { status: "no-move" };
  }

  const matches = legalMoves.filter((m) => {
    if (m.to !== parsed.to) return false;
    if (parsed.from && m.from !== parsed.from) return false;
    if (parsed.piece && m.piece !== parsed.piece) return false;
    if (parsed.promotion && m.promotion !== parsed.promotion) return false;
    return true;
  });

  if (matches.length === 0) return { status: "illegal" };
  if (matches.length === 1) return { status: "ok", move: matches[0] };

  // promotion по умолчанию — ферзь
  const queenPromo = matches.find((m) => m.promotion === "q");
  if (queenPromo && matches.every((m) => m.from === queenPromo.from && m.to === queenPromo.to)) {
    return { status: "ok", move: queenPromo };
  }

  return { status: "ambiguous", candidates: matches };
}

// fuzzy fallback по клеткам из transcript
export function fuzzyMatchSquares(
  transcript: string,
  legalMoves: Move[],
): Move | null {
  const squares = transcript.match(/[a-h][1-8]/gi);
  if (!squares || squares.length === 0) return null;
  const normalized = squares.map((s) => s.toLowerCase()) as Square[];

  if (normalized.length === 1) {
    const candidates = legalMoves.filter((m) => m.to === normalized[0]);
    if (candidates.length === 1) return candidates[0];
  }
  if (normalized.length >= 2) {
    const [from, to] = normalized;
    const exact = legalMoves.find(
      (m) => m.from === from && m.to === to,
    );
    if (exact) return exact;
  }
  return null;
}
