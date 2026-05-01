import { describe, it, expect } from "vitest";
import { parseVoiceInput } from "@/lib/voice/parser";

describe("voice parser — Kazakh", () => {
  describe("ходы фигурами с казахскими названиями", () => {
    it("«ат f3-ке» — конь на f3", () => {
      const r = parseVoiceInput("ат f3-ке", "kk");
      expect(r).toMatchObject({ kind: "move", piece: "n", to: "f3" });
    });

    it("«ат эф үш» — конь на f3 (числа словами)", () => {
      const r = parseVoiceInput("ат эф үш", "kk");
      expect(r).toMatchObject({ kind: "move", piece: "n", to: "f3" });
    });

    it("«пиль c5-ке» — слон на c5", () => {
      const r = parseVoiceInput("пиль c5-ке", "kk");
      expect(r).toMatchObject({ kind: "move", piece: "b", to: "c5" });
    });

    it("«тұра a1» — ладья на a1", () => {
      const r = parseVoiceInput("тұра a1", "kk");
      expect(r).toMatchObject({ kind: "move", piece: "r", to: "a1" });
    });

    it("«уәзір h5» — ферзь на h5", () => {
      const r = parseVoiceInput("уәзір h5", "kk");
      expect(r).toMatchObject({ kind: "move", piece: "q", to: "h5" });
    });

    it("«патша g2» — король на g2", () => {
      const r = parseVoiceInput("патша g2", "kk");
      expect(r).toMatchObject({ kind: "move", piece: "k", to: "g2" });
    });
  });

  describe("казахские падежные окончания", () => {
    it("стрипает -ке", () => {
      const r = parseVoiceInput("e4-ке", "kk");
      expect(r).toMatchObject({ kind: "move", to: "e4" });
    });

    it("стрипает -ге", () => {
      const r = parseVoiceInput("e4-ге", "kk");
      expect(r).toMatchObject({ kind: "move", to: "e4" });
    });

    it("стрипает -да", () => {
      const r = parseVoiceInput("e4-да", "kk");
      expect(r).toMatchObject({ kind: "move", to: "e4" });
    });
  });

  describe("числа словами на казахском", () => {
    const cases: Array<[string, string]> = [
      ["e бір", "e1"],
      ["e екі", "e2"],
      ["e үш", "e3"],
      ["e төрт", "e4"],
      ["e бес", "e5"],
      ["e алты", "e6"],
      ["e жеті", "e7"],
      ["e сегіз", "e8"],
    ];
    for (const [input, expected] of cases) {
      it(`«${input}» → ${expected}`, () => {
        const r = parseVoiceInput(input, "kk");
        expect(r).toMatchObject({ kind: "move", to: expected });
      });
    }
  });

  describe("рокировка на казахском", () => {
    it("«қысқа рокировка» → kingside", () => {
      const r = parseVoiceInput("қысқа рокировка", "kk");
      expect(r).toMatchObject({ kind: "castle", side: "kingside" });
    });

    it("«ұзын рокировка» → queenside", () => {
      const r = parseVoiceInput("ұзын рокировка", "kk");
      expect(r).toMatchObject({ kind: "castle", side: "queenside" });
    });
  });

  describe("команды на казахском", () => {
    it("«жаңа ойын» → newGame", () => {
      expect(parseVoiceInput("жаңа ойын", "kk")).toMatchObject({
        kind: "command",
        command: "newGame",
      });
    });

    it("«берілемін» → resign", () => {
      expect(parseVoiceInput("берілемін", "kk")).toMatchObject({
        kind: "command",
        command: "resign",
      });
    });

    it("«теңдік» → offerDraw", () => {
      expect(parseVoiceInput("теңдік", "kk")).toMatchObject({
        kind: "command",
        command: "offerDraw",
      });
    });

    it("«артқа» → undo", () => {
      expect(parseVoiceInput("артқа", "kk")).toMatchObject({
        kind: "command",
        command: "undo",
      });
    });

    it("«тоқта» → stop", () => {
      expect(parseVoiceInput("тоқта", "kk")).toMatchObject({
        kind: "command",
        command: "stop",
      });
    });
  });

  describe("устойчивость и fallback на русский", () => {
    it("работает с русским когда казахские слова не найдены", () => {
      // ru-fallback: казахский парсер не нашёл, падаем на ru-парсер
      const r = parseVoiceInput("конь эф три", "kk");
      expect(r.kind).toBe("move");
    });

    it("возвращает unknown на бессмыслицу", () => {
      expect(parseVoiceInput("xyz qwe", "kk").kind).toBe("unknown");
    });
  });
});
