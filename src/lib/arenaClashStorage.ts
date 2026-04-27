import type {
  ArenaClashMatchState,
  ArenaClashStoredRuntimeState,
} from "@/lib/arenaClashTypes";

const ARENA_CLASH_RESULT_KEY = "baki_x_kengan_arena_clash_result_v2";
const ARENA_CLASH_STATE_KEY = "baki_x_kengan_arena_clash_state_v2";

type ArenaClashStoredResult = {
  winner: ArenaClashMatchState["winner"];
  loser: ArenaClashMatchState["loser"];
  finishedReason: ArenaClashMatchState["finishedReason"];
  roundNumber: number;
  savedAt: number;
  version: 2;
};

function isValidStoredResult(value: unknown): value is ArenaClashStoredResult {
  if (!value || typeof value !== "object") return false;

  const data = value as Partial<ArenaClashStoredResult>;

  const winnerOk =
    data.winner === "player" || data.winner === "enemy" || data.winner === null;

  const loserOk =
    data.loser === "player" || data.loser === "enemy" || data.loser === null;

  const finishedReasonOk =
    data.finishedReason === "all_eliminated" ||
    data.finishedReason === "collapse" ||
    data.finishedReason === "surrender" ||
    data.finishedReason === "unfinished";

  const roundOk = typeof data.roundNumber === "number";
  const savedAtOk = typeof data.savedAt === "number";
  const versionOk = data.version === 2;

  return winnerOk && loserOk && finishedReasonOk && roundOk && savedAtOk && versionOk;
}

function isValidRuntimeState(
  value: unknown,
): value is ArenaClashStoredRuntimeState {
  if (!value || typeof value !== "object") return false;

  const data = value as Partial<ArenaClashStoredRuntimeState>;

  return (
    typeof data.savedAt === "number" &&
    data.version === 2 &&
    !!data.state &&
    typeof data.state === "object"
  );
}

export function saveArenaClashResult(
  state: ArenaClashMatchState,
): ArenaClashStoredResult {
  const payload: ArenaClashStoredResult = {
    winner: state.winner,
    loser: state.loser,
    finishedReason: state.finishedReason,
    roundNumber: state.roundNumber,
    savedAt: Date.now(),
    version: 2,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ARENA_CLASH_RESULT_KEY, JSON.stringify(payload));
  }

  return payload;
}

export function loadArenaClashResult(): ArenaClashStoredResult | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ARENA_CLASH_RESULT_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredResult(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function clearArenaClashResult(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ARENA_CLASH_RESULT_KEY);
}

export function saveArenaClashState(
  state: ArenaClashMatchState,
): ArenaClashStoredRuntimeState {
  const payload: ArenaClashStoredRuntimeState = {
    state,
    savedAt: Date.now(),
    version: 2,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ARENA_CLASH_STATE_KEY, JSON.stringify(payload));
  }

  return payload;
}

export function loadArenaClashState(): ArenaClashStoredRuntimeState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ARENA_CLASH_STATE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidRuntimeState(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function clearArenaClashState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ARENA_CLASH_STATE_KEY);
}

export function clearAllArenaClashStorage(): void {
  clearArenaClashResult();
  clearArenaClashState();
}