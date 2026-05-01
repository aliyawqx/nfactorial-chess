import type { Square } from "chess.js";
import type { PieceType } from "@/types/chess";
import type { ParsedVoiceInput } from "../types";

const PIECE_MAP: Record<string, PieceType> = {
  pawn: "p",
  p: "p",
  knight: "n",
  n: "n",
  bishop: "b",
  rook: "r",
  r: "r",
  queen: "q",
  q: "q",
  king: "k",
  k: "k",
};

const COMMANDS: Array<{ pattern: RegExp; cmd: ParsedVoiceInput }> = [
  { pattern: /\b(new\s+game|start\s+over|reset)\b/, cmd: { kind: "command", command: "newGame" } },
  { pattern: /\b(resign|i\s+resign|give\s+up)\b/, cmd: { kind: "command", command: "resign" } },
  { pattern: /\b(offer\s+draw|propose\s+draw|draw)\b/, cmd: { kind: "command", command: "offerDraw" } },
  { pattern: /\b(undo|takeback|take\s+back|go\s+back)\b/, cmd: { kind: "command", command: "undo" } },
  { pattern: /\b(what\s+moves|list\s+moves|hint|show\s+moves)\b/, cmd: { kind: "command", command: "listMoves" } },
  { pattern: /\b(read\s+position|describe\s+position|what.s\s+the\s+position)\b/, cmd: { kind: "command", command: "readPosition" } },
  { pattern: /\b(stop|cancel|abort)\b/, cmd: { kind: "command", command: "stop" } },
  { pattern: /\b(help|hotkeys|shortcuts)\b/, cmd: { kind: "command", command: "help" } },
];

const CASTLE_KINGSIDE = /\b(castle\s+(king\s*side|short)|o-?o(?!-?o))\b/;
const CASTLE_QUEENSIDE = /\b(castle\s+(queen\s*side|long)|o-?o-?o)\b/;

const MOVE_REGEX =
  /\b(?:(?<piece>knight|bishop|rook|queen|king|pawn|n|b|r|q|k|p)\s+)?(?:(?<from>[a-h][1-8])\s+)?(?:(?:to|takes|x|capture|captures|—|→)\s+)?(?<to>[a-h][1-8])(?:\s*=?\s*(?<promo>queen|rook|bishop|knight|q|r|b|n))?\b/i;

export function parseEN(text: string): ParsedVoiceInput {
  const t = text.toLowerCase();

  for (const { pattern, cmd } of COMMANDS) {
    if (pattern.test(t)) return cmd;
  }
  if (CASTLE_QUEENSIDE.test(t)) return { kind: "castle", side: "queenside" };
  if (CASTLE_KINGSIDE.test(t)) return { kind: "castle", side: "kingside" };

  const m = t.match(MOVE_REGEX);
  if (!m || !m.groups?.to) return { kind: "unknown", raw: text };

  const capture = /\b(takes|x|captures?)\b/.test(t);
  return {
    kind: "move",
    piece: m.groups.piece ? PIECE_MAP[m.groups.piece] : undefined,
    from: m.groups.from as Square | undefined,
    to: m.groups.to as Square,
    promotion: m.groups.promo ? PIECE_MAP[m.groups.promo] : undefined,
    capture,
  };
}
