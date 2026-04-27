export type AccountProgress = {
  level: number;
  exp: number;
};

const STORAGE_KEY = "bxk_account_progress";
const MAX_LEVEL = 100;

export function clampLevel(level: number) {
  return Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
}

export function getRequiredExpForLevel(level: number) {
  const safeLevel = clampLevel(level);

  if (safeLevel >= MAX_LEVEL) return 0;

  // Плавная, но ощутимая кривая роста
  return 100 + (safeLevel - 1) * 35;
}

export function getTotalExpToReachLevel(targetLevel: number) {
  const safeTarget = clampLevel(targetLevel);
  let total = 0;

  for (let level = 1; level < safeTarget; level += 1) {
    total += getRequiredExpForLevel(level);
  }

  return total;
}

export function normalizeProgress(progress: AccountProgress): AccountProgress {
  let level = clampLevel(progress.level);
  let exp = Math.max(0, Math.floor(progress.exp));

  while (level < MAX_LEVEL) {
    const needed = getRequiredExpForLevel(level);
    if (exp < needed) break;
    exp -= needed;
    level += 1;
  }

  if (level >= MAX_LEVEL) {
    return {
      level: MAX_LEVEL,
      exp: 0,
    };
  }

  return { level, exp };
}

export function getDefaultAccountProgress(): AccountProgress {
  return {
    level: 12,
    exp: 180,
  };
}

export function loadAccountProgress(): AccountProgress {
  if (typeof window === "undefined") {
    return getDefaultAccountProgress();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAccountProgress();

    const parsed = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.level !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return getDefaultAccountProgress();
    }

    return normalizeProgress({
      level: parsed.level,
      exp: parsed.exp,
    });
  } catch {
    return getDefaultAccountProgress();
  }
}

export function saveAccountProgress(progress: AccountProgress) {
  if (typeof window === "undefined") return;

  const normalized = normalizeProgress(progress);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function addAccountExp(amount: number) {
  const safeAmount = Math.max(0, Math.floor(amount));
  const current = loadAccountProgress();

  const next = normalizeProgress({
    level: current.level,
    exp: current.exp + safeAmount,
  });

  saveAccountProgress(next);

  return {
    previous: current,
    next,
    gained: safeAmount,
    leveledUp: next.level > current.level,
    levelsGained: next.level - current.level,
  };
}

export function setAccountLevel(level: number) {
  const safeLevel = clampLevel(level);

  saveAccountProgress({
    level: safeLevel,
    exp: 0,
  });
}

export function setAccountExp(level: number, exp: number) {
  saveAccountProgress({
    level,
    exp,
  });
}

export function getCurrentLevelProgress(progress: AccountProgress) {
  const normalized = normalizeProgress(progress);

  if (normalized.level >= MAX_LEVEL) {
    return {
      currentLevel: MAX_LEVEL,
      currentExp: 0,
      requiredExp: 0,
      progressPercent: 100,
    };
  }

  const requiredExp = getRequiredExpForLevel(normalized.level);
  const progressPercent =
    requiredExp <= 0 ? 100 : Math.max(0, Math.min(100, (normalized.exp / requiredExp) * 100));

  return {
    currentLevel: normalized.level,
    currentExp: normalized.exp,
    requiredExp,
    progressPercent,
  };
}

export const ACCOUNT_MAX_LEVEL = MAX_LEVEL;