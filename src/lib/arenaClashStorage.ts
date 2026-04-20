const ARENA_CLASH_RESULT_KEY = "baki_x_kengan_arena_clash_result";

export type ArenaClashStoredResult = {
  winner: "player" | "enemy" | null;
  loser: "player" | "enemy" | null;
  reason: "all_ko" | "no_tempo_to_field" | "surrender" | "unfinished";
  roundNumber: number;
  exchangeNumber: number;
  playerRemaining: number;
  enemyRemaining: number;
  lastLogLines: string[];
  savedAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveArenaClashResult(result: ArenaClashStoredResult) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ARENA_CLASH_RESULT_KEY, JSON.stringify(result));
}

export function loadArenaClashResult(): ArenaClashStoredResult | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(ARENA_CLASH_RESULT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ArenaClashStoredResult;
  } catch {
    return null;
  }
}

export function clearArenaClashResult() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ARENA_CLASH_RESULT_KEY);
}