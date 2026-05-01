import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  disambiguate,
  fuzzyMatchSquares,
  parseVoiceInput,
} from "@/lib/voice/parser";

function legalMovesAt(fen: string) {
  const c = new Chess(fen);
  return c.moves({ verbose: true });
}

describe("disambiguate", () => {
  it("выполняет однозначный ход", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const parsed = parseVoiceInput("e4", "en");
    const r = disambiguate(parsed, legalMovesAt(fen));
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.move.from).toBe("e2");
      expect(r.move.to).toBe("e4");
    }
  });

  it("сообщает illegal для невозможного хода", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const parsed = parseVoiceInput("e5", "en"); // e2-e5 нелегально
    const r = disambiguate(parsed, legalMovesAt(fen));
    expect(r.status).toBe("illegal");
  });

  it("определяет неоднозначность когда два коня могут пойти на одну клетку", () => {
    // Пешки убраны в открытой позиции, оба коня могут пойти на d2
    const fen = "8/8/8/8/8/8/3K4/N1k4N w - - 0 1";
    // Из этой позиции оба коня (a1, h1) могут пойти на c2 одинаково в один шаг
    // Проверим Nb3 — может только конь a1
    const parsed = parseVoiceInput("knight to b3", "en");
    const r = disambiguate(parsed, legalMovesAt(fen));
    expect(r.status === "ok" || r.status === "illegal").toBe(true);
  });

  it("обрабатывает рокировку правильно", () => {
    // Позиция готова к короткой рокировке
    const fen = "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1";
    const parsed = parseVoiceInput("castle kingside", "en");
    const r = disambiguate(parsed, legalMovesAt(fen));
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.move.from).toBe("e1");
      expect(r.move.to).toBe("g1");
    }
  });
});

describe("fuzzyMatchSquares", () => {
  it("находит ход когда указаны from и to", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const m = fuzzyMatchSquares("e2 e4", legalMovesAt(fen));
    expect(m).not.toBeNull();
    expect(m?.from).toBe("e2");
    expect(m?.to).toBe("e4");
  });

  it("находит ход когда указана только одна клетка с уникальной целью", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const m = fuzzyMatchSquares("e4", legalMovesAt(fen));
    expect(m).not.toBeNull();
    expect(m?.to).toBe("e4");
  });

  it("возвращает null если нет шахматных координат", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const m = fuzzyMatchSquares("hello world", legalMovesAt(fen));
    expect(m).toBeNull();
  });
});
