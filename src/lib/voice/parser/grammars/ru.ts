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
  { pattern: /\b(новая\s+игра|начать\s+заново|новая\s+партия|сброс|перезапуск)\b/, cmd: { kind: "command", command: "newGame" } },
  { pattern: /\b(сдаюсь|сдаться|сдача|поражение)\b/, cmd: { kind: "command", command: "resign" } },
  { pattern: /\b(ничья|предложить\s+ничью|тен(д|т)?ь?)\b/, cmd: { kind: "command", command: "offerDraw" } },
  { pattern: /\b(отменить|отмена|назад|откатить|отойти)\b/, cmd: { kind: "command", command: "undo" } },
  { pattern: /\b(какие\s+ходы|список\s+ходов|подскажи|подсказка|варианты)\b/, cmd: { kind: "command", command: "listMoves" } },
  { pattern: /\b(прочитай\s+позицию|опиши\s+позицию|что\s+на\s+доске)\b/, cmd: { kind: "command", command: "readPosition" } },
  { pattern: /\b(стоп|отбой|выключи)\b/, cmd: { kind: "command", command: "stop" } },
  { pattern: /\b(помощь|справка|горячие\s+клавиши)\b/, cmd: { kind: "command", command: "help" } },
];

const CASTLE_KINGSIDE = /\b(короткая\s+рокировка|рокировка\s+короткая|0-0(?!-?0)|о-?о(?!-?о))\b/;
const CASTLE_QUEENSIDE = /\b(длинная\s+рокировка|рокировка\s+длинная|0-0-0|о-?о-?о)\b/;

const MOVE_REGEX =
  /(?:(?<piece>пешка|пешку|пешкой|конь|коня|конём|конем|слон|слона|слоном|ладья|ладью|ладьёй|ладьей|ладьи|тура|туры|ферзь|ферзя|ферзём|ферзем|королева|королеву|король|короля)\s*(?:на|до|на\s+поле|идёт\s+на|идет\s+на)?\s*)?(?:(?<from>[a-h][1-8])\s*(?:на|до|—|->|→)?\s*)?(?<to>[a-h][1-8])(?:\s*(?:=|превращение\s+в)\s*(?<promo>ферзь|ладья|слон|конь|q|r|b|n))?/i;

export function parseRU(text: string): ParsedVoiceInput {
  const t = text.toLowerCase();

  for (const { pattern, cmd } of COMMANDS) {
    if (pattern.test(t)) return cmd;
  }
  if (CASTLE_QUEENSIDE.test(t)) return { kind: "castle", side: "queenside" };
  if (CASTLE_KINGSIDE.test(t)) return { kind: "castle", side: "kingside" };

  const m = t.match(MOVE_REGEX);
  if (!m || !m.groups?.to) return { kind: "unknown", raw: text };

  const capture = /\b(бьёт|бьет|берёт|берет|взятие|съедает)\b/.test(t);
  return {
    kind: "move",
    piece: m.groups.piece ? PIECE_MAP[m.groups.piece] : undefined,
    from: m.groups.from as Square | undefined,
    to: m.groups.to as Square,
    promotion: m.groups.promo ? PIECE_MAP[m.groups.promo] : undefined,
    capture,
  };
}
