import type { ArenaClashStoredSetup } from "@/lib/arenaClashTypes";

const ARENA_CLASH_SETUP_KEY = "baki_x_kengan_arena_clash_setup_v2";

function isValidArenaClashStoredSetup(
  value: unknown,
): value is ArenaClashStoredSetup {
  if (!value || typeof value !== "object") return false;

  const data = value as Partial<ArenaClashStoredSetup>;

  const fighterDeckOk =
    Array.isArray(data.fighterDeckIds) &&
    data.fighterDeckIds.every((id) => typeof id === "number");

  const supportIdsOk =
    Array.isArray(data.supportIds) &&
    data.supportIds.every((id) => typeof id === "string");

  const godLikeOk =
    data.godLikeSupportId === null ||
    typeof data.godLikeSupportId === "string";

  const enemyDeckOk =
    data.enemyDeckIds === undefined ||
    data.enemyDeckIds === null ||
    (Array.isArray(data.enemyDeckIds) &&
      data.enemyDeckIds.every((id) => typeof id === "number"));

  const savedAtOk = typeof data.savedAt === "number";
  const versionOk = data.version === 2;

  return (
    fighterDeckOk &&
    supportIdsOk &&
    godLikeOk &&
    enemyDeckOk &&
    savedAtOk &&
    versionOk
  );
}

export function saveArenaClashSetup(input: {
  fighterDeckIds: number[];
  supportIds?: string[];
  godLikeSupportId?: string | null;
  enemyDeckIds?: number[] | null;
}): ArenaClashStoredSetup {
  const payload: ArenaClashStoredSetup = {
    fighterDeckIds: [...new Set(input.fighterDeckIds)].slice(0, 10),
    supportIds: [...new Set(input.supportIds ?? [])].slice(0, 2),
    godLikeSupportId: input.godLikeSupportId ?? null,
    enemyDeckIds: input.enemyDeckIds
      ? [...new Set(input.enemyDeckIds)].slice(0, 10)
      : null,
    savedAt: Date.now(),
    version: 2,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ARENA_CLASH_SETUP_KEY, JSON.stringify(payload));
  }

  return payload;
}

export function loadArenaClashSetup(): ArenaClashStoredSetup | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ARENA_CLASH_SETUP_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidArenaClashStoredSetup(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function clearArenaClashSetup(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ARENA_CLASH_SETUP_KEY);
}