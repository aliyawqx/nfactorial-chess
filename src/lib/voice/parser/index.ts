import { normalize } from "./normalize";
import { parseEN } from "./grammars/en";
import { parseRU } from "./grammars/ru";
import { parseKK } from "./grammars/kk";
import { disambiguate, fuzzyMatchSquares, type DisambigResult } from "./disambiguate";
import type { ParsedVoiceInput, Locale } from "./types";
import type { Move } from "chess.js";

export type { ParsedVoiceInput, Locale, DisambigResult };
export { disambiguate, fuzzyMatchSquares };

export function parseVoiceInput(text: string, locale: Locale): ParsedVoiceInput {
  const normalized = normalize(text, locale);
  if (!normalized) return { kind: "unknown", raw: text };

  switch (locale) {
    case "en":
      return parseEN(normalized);
    case "ru":
      return parseRU(normalized);
    case "kk":
      // Kazakh — пробуем kk-парсер, при неудаче падаем на ru (русский часто перемежается)
      const kk = parseKK(normalized);
      if (kk.kind !== "unknown") return kk;
      return parseRU(normalized);
  }
}

export interface ResolveResult {
  parsed: ParsedVoiceInput;
  resolution: DisambigResult;
}

export function resolveVoiceMove(
  text: string,
  locale: Locale,
  legalMoves: Move[],
): ResolveResult {
  const parsed = parseVoiceInput(text, locale);
  let resolution = disambiguate(parsed, legalMoves);

  // Если парсер не понял или ход illegal — пробуем fuzzy matching по клеткам в исходном тексте
  if (resolution.status === "illegal" || resolution.status === "no-move") {
    const fuzzy = fuzzyMatchSquares(normalize(text, locale), legalMoves);
    if (fuzzy) {
      resolution = { status: "ok", move: fuzzy };
    }
  }

  return { parsed, resolution };
}
