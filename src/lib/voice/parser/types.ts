import type { Square } from "chess.js";
import type { PieceType } from "@/types/chess";

export type VoiceCommand =
  | "newGame"
  | "resign"
  | "offerDraw"
  | "undo"
  | "listMoves"
  | "readPosition"
  | "stop"
  | "help";

export type ParsedVoiceInput =
  | { kind: "move"; piece?: PieceType; from?: Square; to: Square; promotion?: PieceType; capture?: boolean }
  | { kind: "castle"; side: "kingside" | "queenside" }
  | { kind: "command"; command: VoiceCommand }
  | { kind: "unknown"; raw: string };

export type Locale = "ru" | "en" | "kk";
