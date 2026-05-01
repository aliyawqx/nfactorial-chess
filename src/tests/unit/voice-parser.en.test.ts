import { describe, it, expect } from "vitest";
import { parseVoiceInput } from "@/lib/voice/parser";

describe("voice parser — English", () => {
  describe("pawn moves", () => {
    it("parses «e4»", () => {
      expect(parseVoiceInput("e4", "en")).toMatchObject({
        kind: "move",
        to: "e4",
      });
    });

    it("parses «e four»", () => {
      expect(parseVoiceInput("e four", "en")).toMatchObject({
        kind: "move",
        to: "e4",
      });
    });

    it("parses «pawn to e4»", () => {
      expect(parseVoiceInput("pawn to e4", "en")).toMatchObject({
        kind: "move",
        piece: "p",
        to: "e4",
      });
    });
  });

  describe("piece moves", () => {
    it("parses «knight to f3»", () => {
      expect(parseVoiceInput("knight to f3", "en")).toMatchObject({
        kind: "move",
        piece: "n",
        to: "f3",
      });
    });

    it("parses «knight f3»", () => {
      expect(parseVoiceInput("knight f3", "en")).toMatchObject({
        kind: "move",
        piece: "n",
        to: "f3",
      });
    });

    it("parses «bishop b5»", () => {
      expect(parseVoiceInput("bishop b5", "en")).toMatchObject({
        kind: "move",
        piece: "b",
        to: "b5",
      });
    });

    it("parses «queen h5»", () => {
      expect(parseVoiceInput("queen h5", "en")).toMatchObject({
        kind: "move",
        piece: "q",
        to: "h5",
      });
    });

    it("parses «king g2»", () => {
      expect(parseVoiceInput("king g2", "en")).toMatchObject({
        kind: "move",
        piece: "k",
        to: "g2",
      });
    });

    it("parses «rook a1»", () => {
      expect(parseVoiceInput("rook a1", "en")).toMatchObject({
        kind: "move",
        piece: "r",
        to: "a1",
      });
    });
  });

  describe("captures", () => {
    it("parses «bishop takes c5»", () => {
      expect(parseVoiceInput("bishop takes c5", "en")).toMatchObject({
        kind: "move",
        piece: "b",
        to: "c5",
        capture: true,
      });
    });

    it("parses «knight captures e4»", () => {
      expect(parseVoiceInput("knight captures e4", "en")).toMatchObject({
        kind: "move",
        piece: "n",
        to: "e4",
        capture: true,
      });
    });
  });

  describe("castling", () => {
    it("parses «castle kingside»", () => {
      expect(parseVoiceInput("castle kingside", "en")).toMatchObject({
        kind: "castle",
        side: "kingside",
      });
    });

    it("parses «castle queenside»", () => {
      expect(parseVoiceInput("castle queenside", "en")).toMatchObject({
        kind: "castle",
        side: "queenside",
      });
    });

    it("parses «castle short»", () => {
      expect(parseVoiceInput("castle short", "en")).toMatchObject({
        kind: "castle",
        side: "kingside",
      });
    });

    it("parses «castle long»", () => {
      expect(parseVoiceInput("castle long", "en")).toMatchObject({
        kind: "castle",
        side: "queenside",
      });
    });
  });

  describe("commands", () => {
    it("«new game»", () => {
      expect(parseVoiceInput("new game", "en")).toMatchObject({
        kind: "command",
        command: "newGame",
      });
    });

    it("«resign»", () => {
      expect(parseVoiceInput("resign", "en")).toMatchObject({
        kind: "command",
        command: "resign",
      });
    });

    it("«offer draw»", () => {
      expect(parseVoiceInput("offer draw", "en")).toMatchObject({
        kind: "command",
        command: "offerDraw",
      });
    });

    it("«undo» / «takeback»", () => {
      expect(parseVoiceInput("undo", "en")).toMatchObject({
        kind: "command",
        command: "undo",
      });
      expect(parseVoiceInput("takeback", "en")).toMatchObject({
        kind: "command",
        command: "undo",
      });
    });

    it("«what moves»", () => {
      expect(parseVoiceInput("what moves", "en")).toMatchObject({
        kind: "command",
        command: "listMoves",
      });
    });

    it("«stop»", () => {
      expect(parseVoiceInput("stop", "en")).toMatchObject({
        kind: "command",
        command: "stop",
      });
    });
  });

  describe("noise tolerance", () => {
    it("ignores punctuation", () => {
      expect(parseVoiceInput("knight, to f3.", "en")).toMatchObject({
        kind: "move",
        piece: "n",
        to: "f3",
      });
    });

    it("works in upper case", () => {
      expect(parseVoiceInput("KNIGHT TO F3", "en")).toMatchObject({
        kind: "move",
        piece: "n",
        to: "f3",
      });
    });

    it("returns unknown for gibberish", () => {
      expect(parseVoiceInput("blah blah", "en").kind).toBe("unknown");
    });
  });
});
