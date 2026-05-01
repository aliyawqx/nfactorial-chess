import type { Square } from "chess.js";
import type { PieceType } from "@/types/chess";
import type { ParsedVoiceInput } from "../types";

// Карта русских названий фигур (включая разные падежи и сокращения)
const PIECE_MAP: Record<string, PieceType> = {
  пешка: "p",
  пешку: "p",
  пешкой: "p",
  конь: "n",
  коня: "n",
  конём: "n",
  конем: "n",
  слон: "b",
  слона: "b",
  слоном: "b",
  ладья: "r",
  ладьи: "r",
  ладью: "r",
  ладьёй: "r",
  ладьей: "r",
  тура: "r",
  туры: "r",
  ферзь: "q",
  ферзя: "q",
  ферзём: "q",
  ферзем: "q",
  королева: "q",
  королеву: "q",
  король: "k",
  короля: "k",
  королём: "k",
  королем: "k",
};

const COMMANDS: Array<{ pattern: RegExp; cmd: ParsedVoiceInput }> = [
  { pattern: /(новая\s+игра|начать\s+заново|новая\s+партия|сброс|перезапуск)/, cmd: { kind: "command", command: "newGame" } },
  { pattern: /(сдаюсь|сдаться|сдача|поражение)/, cmd: { kind: "command", command: "resign" } },
  { pattern: /(ничья|предложить\s+ничью)/, cmd: { kind: "command", command: "offerDraw" } },
  { pattern: /(отменить|отмена|назад|откатить|отойти)/, cmd: { kind: "command", command: "undo" } },
  { pattern: /(какие\s+ходы|список\s+ходов|подскажи|подсказка|варианты)/, cmd: { kind: "command", command: "listMoves" } },
  { pattern: /(прочитай\s+позицию|опиши\s+позицию|что\s+на\s+доске)/, cmd: { kind: "command", command: "readPosition" } },
  { pattern: /(стоп|отбой|выключи)/, cmd: { kind: "command", command: "stop" } },
  { pattern: /(помощь|справка|горячие\s+клавиши)/, cmd: { kind: "command", command: "help" } },
];

const CASTLE_KINGSIDE = /(короткая\s+рокировка|рокировка\s+короткая|0-0(?!-?0))/;
const CASTLE_QUEENSIDE = /(длинная\s+рокировка|рокировка\s+длинная|0-0-0)/;

const MOVE_REGEX =
  /(?:(?<piece>пешка|пешку|пешкой|конь|коня|конём|конем|слон|слона|слоном|ладья|ладью|ладьёй|ладьей|ладьи|тура|туры|ферзь|ферзя|ферзём|ферзем|королева|королеву|король|короля)\s*(?:на|до|на\s+поле|идёт\s+на|идет\s+на|бьёт|бьет|берёт|берет|съедает|x|—|->|→)?\s*)?(?:(?<from>[a-h][1-8])\s*(?:на|до|—|->|→|бьёт|бьет|берёт|берет|x)?\s*)?(?<to>[a-h][1-8])(?:\s*(?:=|превращение\s+в)\s*(?<promo>ферзь|ладья|слон|конь|q|r|b|n))?/i;

export function parseRU(text: string): ParsedVoiceInput {
  const t = text.toLowerCase();

  for (const { pattern, cmd } of COMMANDS) {
    if (pattern.test(t)) return cmd;
  }
  if (CASTLE_QUEENSIDE.test(t)) return { kind: "castle", side: "queenside" };
  if (CASTLE_KINGSIDE.test(t)) return { kind: "castle", side: "kingside" };

  const m = t.match(MOVE_REGEX);
  if (!m || !m.groups?.to) return { kind: "unknown", raw: text };

  const capture = /(бьёт|бьет|берёт|берет|взятие|съедает)/.test(t);
  return {
    kind: "move",
    piece: m.groups.piece ? PIECE_MAP[m.groups.piece] : undefined,
    from: m.groups.from as Square | undefined,
    to: m.groups.to as Square,
    promotion: m.groups.promo ? PIECE_MAP[m.groups.promo] : undefined,
    capture,
  };
}
