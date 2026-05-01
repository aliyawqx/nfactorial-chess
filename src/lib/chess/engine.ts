"use client";

export interface EngineSearchParams {
  fen: string;
  depth?: number;
  movetime?: number;
  skillLevel?: number;
  multiPV?: number;
}

export interface EngineSearchResult {
  bestmove: string;
  ponder?: string;
  evalCp?: number;
  evalMate?: number;
  pv?: string[];
  depth?: number;
}

type EngineMessage =
  | { type: "info"; line: string }
  | { type: "bestmove"; line: string }
  | { type: "ready" }
  | { type: "uciok" };

export class StockfishEngine {
  private worker: Worker;
  private ready = false;
  private uciOk = false;
  private listeners = new Set<(msg: EngineMessage) => void>();

  constructor(scriptUrl = "/stockfish/stockfish-18-lite-single.js") {
    this.worker = new Worker(scriptUrl);
    this.worker.onmessage = (e: MessageEvent<string>) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (!line) return;
      if (line === "uciok") {
        this.uciOk = true;
        for (const l of this.listeners) l({ type: "uciok" });
      } else if (line === "readyok") {
        this.ready = true;
        for (const l of this.listeners) l({ type: "ready" });
      } else if (line.startsWith("bestmove")) {
        for (const l of this.listeners) l({ type: "bestmove", line });
      } else if (line.startsWith("info")) {
        for (const l of this.listeners) l({ type: "info", line });
      }
    };

    this.worker.postMessage("uci");
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }

  private waitFor<T>(
    predicate: (msg: EngineMessage) => T | null,
    timeoutMs = 30000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(handler);
        reject(new Error("Stockfish: timeout"));
      }, timeoutMs);
      const handler = (msg: EngineMessage) => {
        const value = predicate(msg);
        if (value !== null) {
          clearTimeout(timer);
          this.listeners.delete(handler);
          resolve(value);
        }
      };
      this.listeners.add(handler);
    });
  }

  async ensureReady(): Promise<void> {
    if (!this.uciOk) {
      await this.waitFor((m) => (m.type === "uciok" ? true : null));
    }
    this.send("isready");
    await this.waitFor((m) => (m.type === "ready" ? true : null));
  }

  setSkillLevel(level: number) {
    this.send(`setoption name Skill Level value ${Math.max(0, Math.min(20, Math.round(level)))}`);
  }

  setUciElo(elo: number | null) {
    if (elo === null) {
      this.send("setoption name UCI_LimitStrength value false");
    } else {
      this.send("setoption name UCI_LimitStrength value true");
      this.send(`setoption name UCI_Elo value ${Math.max(1320, Math.min(3190, elo))}`);
    }
  }

  newGame() {
    this.send("ucinewgame");
  }

  async search(params: EngineSearchParams): Promise<EngineSearchResult> {
    await this.ensureReady();
    return this.searchStreaming(params, () => {});
  }

  async searchStreaming(
    params: EngineSearchParams,
    onInfo: (info: {
      evalCp?: number;
      evalMate?: number;
      pv?: string[];
      depth?: number;
    }) => void,
  ): Promise<EngineSearchResult> {
    await this.ensureReady();
    this.send(`position fen ${params.fen}`);
    const goCmd = params.movetime
      ? `go movetime ${params.movetime}`
      : `go depth ${params.depth ?? 12}`;

    return new Promise((resolve) => {
      let lastInfo: {
        evalCp?: number;
        evalMate?: number;
        pv?: string[];
        depth?: number;
      } = {};

      const handler = (msg: EngineMessage) => {
        if (msg.type === "info") {
          const parsed = parseInfo(msg.line);
          if (parsed) {
            lastInfo = { ...lastInfo, ...parsed };
            onInfo(lastInfo);
          }
          return;
        }
        if (msg.type === "bestmove") {
          this.listeners.delete(handler);
          const parts = msg.line.split(/\s+/);
          resolve({
            bestmove: parts[1],
            ponder: parts[3],
            ...lastInfo,
          });
        }
      };
      this.listeners.add(handler);
      this.send(goCmd);
    });
  }

  stop() {
    this.send("stop");
  }

  destroy() {
    this.send("quit");
    this.worker.terminate();
    this.listeners.clear();
  }
}

function parseInfo(line: string) {
  if (!line.startsWith("info")) return null;
  const tokens = line.split(/\s+/);
  const info: { evalCp?: number; evalMate?: number; pv?: string[]; depth?: number } = {};
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "depth") info.depth = parseInt(tokens[++i], 10);
    else if (t === "score") {
      const kind = tokens[++i];
      const v = parseInt(tokens[++i], 10);
      if (kind === "cp") info.evalCp = v;
      else if (kind === "mate") info.evalMate = v;
    } else if (t === "pv") {
      info.pv = tokens.slice(i + 1);
      break;
    }
  }
  return info;
}

let singleton: StockfishEngine | null = null;

export function getEngine(): StockfishEngine {
  if (typeof window === "undefined") {
    throw new Error("Stockfish requires browser context");
  }
  if (!singleton) {
    singleton = new StockfishEngine();
  }
  return singleton;
}
