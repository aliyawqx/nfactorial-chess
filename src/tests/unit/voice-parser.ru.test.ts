import { describe, it, expect } from "vitest";
import { parseVoiceInput } from "@/lib/voice/parser";

describe("voice parser — Russian", () => {
  describe("ходы пешками", () => {
    it("распознает «е четыре»", () => {
      const r = parseVoiceInput("е четыре", "ru");
      expect(r).toMatchObject({ kind: "move", to: "e4" });
    });

    it("распознает «е4» (склейка)", () => {
      const r = parseVoiceInput("е4", "ru");
      expect(r).toMatchObject({ kind: "move", to: "e4" });
    });

    it("распознает «пешка на е четыре»", () => {
      const r = parseVoiceInput("пешка на е четыре", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "p", to: "e4" });
    });

    it("распознает «пешка эф пять»", () => {
      const r = parseVoiceInput("пешка эф пять", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "p", to: "f5" });
    });

    it("распознает «де четыре»", () => {
      const r = parseVoiceInput("де четыре", "ru");
      expect(r).toMatchObject({ kind: "move", to: "d4" });
    });
  });

  describe("ходы фигурами", () => {
    it("распознает «конь эф три»", () => {
      const r = parseVoiceInput("конь эф три", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "n", to: "f3" });
    });

    it("распознает «конь на эф три»", () => {
      const r = parseVoiceInput("конь на эф три", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "n", to: "f3" });
    });

    it("распознает «слон це четыре»", () => {
      const r = parseVoiceInput("слон це четыре", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "b", to: "c4" });
    });

    it("распознает «ладья а один»", () => {
      const r = parseVoiceInput("ладья а один", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "r", to: "a1" });
    });

    it("распознает «ферзь аш пять»", () => {
      const r = parseVoiceInput("ферзь аш пять", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "q", to: "h5" });
    });

    it("распознает «король же два»", () => {
      const r = parseVoiceInput("король же два", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "k", to: "g2" });
    });

    it("распознает «тура» как ладью (диалект)", () => {
      const r = parseVoiceInput("тура а один", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "r", to: "a1" });
    });

    it("распознает падежные формы фигур", () => {
      expect(parseVoiceInput("конём эф три", "ru")).toMatchObject({
        kind: "move",
        piece: "n",
        to: "f3",
      });
      expect(parseVoiceInput("ферзя аш пять", "ru")).toMatchObject({
        kind: "move",
        piece: "q",
        to: "h5",
      });
    });
  });

  describe("ходы с указанием from", () => {
    it("распознает «е два е четыре»", () => {
      const r = parseVoiceInput("е два е четыре", "ru");
      expect(r).toMatchObject({ kind: "move", from: "e2", to: "e4" });
    });

    it("распознает взятие «слон бьёт це пять»", () => {
      const r = parseVoiceInput("слон бьёт це пять", "ru");
      expect(r).toMatchObject({
        kind: "move",
        piece: "b",
        to: "c5",
        capture: true,
      });
    });

    it("распознает взятие «берет це шесть»", () => {
      const r = parseVoiceInput("конь берет це шесть", "ru");
      expect(r).toMatchObject({
        kind: "move",
        piece: "n",
        to: "c6",
        capture: true,
      });
    });
  });

  describe("рокировка", () => {
    it("распознает «короткая рокировка»", () => {
      const r = parseVoiceInput("короткая рокировка", "ru");
      expect(r).toMatchObject({ kind: "castle", side: "kingside" });
    });

    it("распознает «длинная рокировка»", () => {
      const r = parseVoiceInput("длинная рокировка", "ru");
      expect(r).toMatchObject({ kind: "castle", side: "queenside" });
    });

    it("распознает «рокировка короткая» (другой порядок)", () => {
      const r = parseVoiceInput("рокировка короткая", "ru");
      expect(r).toMatchObject({ kind: "castle", side: "kingside" });
    });
  });

  describe("команды управления", () => {
    it("«новая игра»", () => {
      const r = parseVoiceInput("новая игра", "ru");
      expect(r).toMatchObject({ kind: "command", command: "newGame" });
    });

    it("«начать заново»", () => {
      const r = parseVoiceInput("начать заново", "ru");
      expect(r).toMatchObject({ kind: "command", command: "newGame" });
    });

    it("«сдаюсь»", () => {
      const r = parseVoiceInput("сдаюсь", "ru");
      expect(r).toMatchObject({ kind: "command", command: "resign" });
    });

    it("«ничья»", () => {
      const r = parseVoiceInput("ничья", "ru");
      expect(r).toMatchObject({ kind: "command", command: "offerDraw" });
    });

    it("«отменить ход» / «назад»", () => {
      expect(parseVoiceInput("отменить", "ru")).toMatchObject({
        kind: "command",
        command: "undo",
      });
      expect(parseVoiceInput("назад", "ru")).toMatchObject({
        kind: "command",
        command: "undo",
      });
    });

    it("«какие ходы»", () => {
      const r = parseVoiceInput("какие ходы", "ru");
      expect(r).toMatchObject({ kind: "command", command: "listMoves" });
    });

    it("«стоп»", () => {
      const r = parseVoiceInput("стоп", "ru");
      expect(r).toMatchObject({ kind: "command", command: "stop" });
    });

    it("«помощь»", () => {
      const r = parseVoiceInput("помощь", "ru");
      expect(r).toMatchObject({ kind: "command", command: "help" });
    });
  });

  describe("устойчивость к шуму", () => {
    it("игнорирует пунктуацию", () => {
      const r = parseVoiceInput("конь, эф три!", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "n", to: "f3" });
    });

    it("работает в верхнем регистре", () => {
      const r = parseVoiceInput("КОНЬ ЭФ ТРИ", "ru");
      expect(r).toMatchObject({ kind: "move", piece: "n", to: "f3" });
    });

    it("возвращает unknown на бессмыслицу", () => {
      const r = parseVoiceInput("бла бла бла", "ru");
      expect(r.kind).toBe("unknown");
    });
  });
});
