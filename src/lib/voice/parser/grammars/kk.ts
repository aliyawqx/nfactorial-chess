import type { Square } from "chess.js";
import type { PieceType } from "@/types/chess";
import type { ParsedVoiceInput } from "../types";

const PIECE_MAP: Record<string, PieceType> = {
  пешка: "p",
  пешканы: "p",
  ат: "n",
  атты: "n",
  пиль: "b",
  пілі: "b",
  пілшік: "b",
  тұра: "r",
  тура: "r",
  тұраны: "r",
  уәзір: "q",
  уазир: "q",
  ферзь: "q",
  патша: "k",
  патшаны: "k",
  король: "k",
};

const COMMANDS: Array<{ pattern: RegExp; cmd: ParsedVoiceInput }> = [
  { pattern: /(жаңа\s+ойын|жана\s+ойын|қайта\s+баста|кайта\s+баста)/, cmd: { kind: "command", command: "newGame" } },
  { pattern: /(берілемін|берилемин|жеңіліс|женилис|сдаюсь)/, cmd: { kind: "command", command: "resign" } },
  { pattern: /(теңдік|тендик|тең\s+ойын|тен\s+ойын|ничья)/, cmd: { kind: "command", command: "offerDraw" } },
  { pattern: /(артқа|артка|қайтару|кайтару|болдырма)/, cmd: { kind: "command", command: "undo" } },
  { pattern: /(қандай\s+жүрістер|кандай\s+журистер|жүрістер|журистер)/, cmd: { kind: "command", command: "listMoves" } },
  { pattern: /(позицияны\s+оқы|позицияны\s+оки)/, cmd: { kind: "command", command: "readPosition" } },
  { pattern: /(тоқта|токта|тоқтату|токтату)/, cmd: { kind: "command", command: "stop" } },
  { pattern: /(көмек|комек|анықтама|аныктама)/, cmd: { kind: "command", command: "help" } },
];

const CASTLE_KINGSIDE = /(қысқа\s+рокировка|кыска\s+рокировка|шорт\s+рокировка|0-0(?!-?0))/;
const CASTLE_QUEENSIDE = /(ұзын\s+рокировка|узын\s+рокировка|лонг\s+рокировка|0-0-0)/;

const MOVE_REGEX =
  /(?:(?<piece>пешка|пешканы|ат|атты|пиль|пілі|пілшік|тұра|тура|тұраны|уәзір|уазир|ферзь|патша|патшаны|король)\s*)?(?:(?<from>[a-h][1-8])\s*(?:-(?:ке|ге|да|де|нан|нен|тан|тен))?\s*)?(?<to>[a-h][1-8])(?:-(?:ке|ге|да|де|нан|нен|тан|тен))?(?:\s*=\s*(?<promo>уәзір|тұра|пиль|ат|q|r|b|n))?/i;

export function parseKK(text: string): ParsedVoiceInput {
  const t = text.toLowerCase();

  for (const { pattern, cmd } of COMMANDS) {
    if (pattern.test(t)) return cmd;
  }
  if (CASTLE_QUEENSIDE.test(t)) return { kind: "castle", side: "queenside" };
  if (CASTLE_KINGSIDE.test(t)) return { kind: "castle", side: "kingside" };

  const m = t.match(MOVE_REGEX);
  if (!m || !m.groups?.to) return { kind: "unknown", raw: text };

  const capture = /(алады|алу|жейді|жеу)/.test(t);
  return {
    kind: "move",
    piece: m.groups.piece ? PIECE_MAP[m.groups.piece] : undefined,
    from: m.groups.from as Square | undefined,
    to: m.groups.to as Square,
    promotion: m.groups.promo ? PIECE_MAP[m.groups.promo] : undefined,
    capture,
  };
}
