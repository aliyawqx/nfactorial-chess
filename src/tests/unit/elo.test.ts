import { describe, it, expect } from "vitest";
import {
  calcEloDelta,
  expectedScore,
  applyGameResult,
  DEFAULT_ELO,
} from "@/lib/chess/elo";

describe("ELO calculator", () => {
  describe("expectedScore", () => {
    it("равных игроков → 0.5", () => {
      expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 3);
    });

    it("сильнее на 200 → ~0.76", () => {
      expect(expectedScore(1400, 1200)).toBeCloseTo(0.76, 1);
    });

    it("слабее на 400 → ~0.09", () => {
      expect(expectedScore(1000, 1400)).toBeCloseTo(0.09, 1);
    });
  });

  describe("calcEloDelta", () => {
    it("равные победили → +16", () => {
      expect(calcEloDelta(1200, 1200, "win")).toBe(16);
    });

    it("равные проиграли → -16", () => {
      expect(calcEloDelta(1200, 1200, "loss")).toBe(-16);
    });

    it("равные ничья → 0", () => {
      expect(calcEloDelta(1200, 1200, "draw")).toBe(0);
    });

    it("сильный победил слабого → маленький прирост", () => {
      const delta = calcEloDelta(1600, 1200, "win");
      expect(delta).toBeGreaterThan(0);
      expect(delta).toBeLessThan(10);
    });

    it("слабый победил сильного → большой прирост", () => {
      const delta = calcEloDelta(1200, 1600, "win");
      expect(delta).toBeGreaterThan(20);
      expect(delta).toBeLessThanOrEqual(32);
    });
  });

  describe("applyGameResult", () => {
    it("белые выиграли — оба меняются на симметричные значения", () => {
      const r = applyGameResult({
        whiteElo: 1200,
        blackElo: 1200,
        result: "1-0",
      });
      expect(r.whiteDelta).toBe(16);
      expect(r.blackDelta).toBe(-16);
      expect(r.whiteAfter).toBe(1216);
      expect(r.blackAfter).toBe(1184);
    });

    it("чёрные выиграли", () => {
      const r = applyGameResult({
        whiteElo: 1200,
        blackElo: 1200,
        result: "0-1",
      });
      expect(r.whiteDelta).toBe(-16);
      expect(r.blackDelta).toBe(16);
    });

    it("ничья между равными — без изменений", () => {
      const r = applyGameResult({
        whiteElo: 1200,
        blackElo: 1200,
        result: "1/2-1/2",
      });
      expect(r.whiteDelta).toBe(0);
      expect(r.blackDelta).toBe(0);
    });

    it("сумма дельт всегда ноль (zero-sum)", () => {
      const cases: Array<{ w: number; b: number; r: "1-0" | "0-1" | "1/2-1/2" }> = [
        { w: 1200, b: 1200, r: "1-0" },
        { w: 1500, b: 1100, r: "0-1" },
        { w: 1800, b: 1300, r: "1/2-1/2" },
        { w: 1000, b: 2000, r: "1-0" },
      ];
      for (const c of cases) {
        const r = applyGameResult({ whiteElo: c.w, blackElo: c.b, result: c.r });
        expect(r.whiteDelta + r.blackDelta).toBe(0);
      }
    });
  });

  it("DEFAULT_ELO = 1200", () => {
    expect(DEFAULT_ELO).toBe(1200);
  });
});
