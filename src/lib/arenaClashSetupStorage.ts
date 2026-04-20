const ARENA_CLASH_SETUP_KEY = "baki_x_kengan_arena_clash_setup";

export type ArenaClashStoredSetup = {
  playerDeck: unknown[];
  enemyDeck: unknown[];
  savedAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveArenaClashSetup(setup: ArenaClashStoredSetup) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ARENA_CLASH_SETUP_KEY, JSON.stringify(setup));
}

export function loadArenaClashSetup(): ArenaClashStoredSetup | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(ARENA_CLASH_SETUP_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ArenaClashStoredSetup;
  } catch {
    return null;
  }
}

export function clearArenaClashSetup() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ARENA_CLASH_SETUP_KEY);
}