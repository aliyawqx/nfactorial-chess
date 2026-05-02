// Классический Elo-рейтинг.
// K-factor 32 — стандарт для любительского уровня (FIDE для < 2400 использует 20-40).
// Стартовый рейтинг 1200.

const DEFAULT_K = 32;
export const DEFAULT_ELO = 1200;

export type GameOutcome = "win" | "loss" | "draw";

/**
 * Ожидаемый результат для игрока А против игрока Б.
 * Возвращает число от 0 до 1.
 */
export function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Изменение рейтинга игрока после партии.
 * outcome: результат с точки зрения этого игрока ("win"/"draw"/"loss").
 */
export function calcEloDelta(
  playerElo: number,
  opponentElo: number,
  outcome: GameOutcome,
  k: number = DEFAULT_K,
): number {
  const expected = expectedScore(playerElo, opponentElo);
  const actual = outcome === "win" ? 1 : outcome === "draw" ? 0.5 : 0;
  return Math.round(k * (actual - expected));
}

/**
 * Применить изменение к обоим игрокам.
 * `result` в шахматной нотации с точки зрения белых.
 */
export function applyGameResult(params: {
  whiteElo: number;
  blackElo: number;
  result: "1-0" | "0-1" | "1/2-1/2";
  k?: number;
}): { whiteAfter: number; blackAfter: number; whiteDelta: number; blackDelta: number } {
  const whiteOutcome: GameOutcome =
    params.result === "1-0" ? "win" : params.result === "0-1" ? "loss" : "draw";
  const blackOutcome: GameOutcome =
    params.result === "0-1" ? "win" : params.result === "1-0" ? "loss" : "draw";

  const whiteDelta = calcEloDelta(
    params.whiteElo,
    params.blackElo,
    whiteOutcome,
    params.k,
  );
  const blackDelta = calcEloDelta(
    params.blackElo,
    params.whiteElo,
    blackOutcome,
    params.k,
  );

  return {
    whiteAfter: params.whiteElo + whiteDelta,
    blackAfter: params.blackElo + blackDelta,
    whiteDelta,
    blackDelta,
  };
}
