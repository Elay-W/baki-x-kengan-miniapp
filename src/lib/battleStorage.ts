import type { FighterCard } from "@/types/game";
import type { BattleMode, BattleResultData } from "@/lib/battleMock";

const BATTLE_SETUP_KEY = "bxk_battle_setup";
const BATTLE_RESULT_KEY = "bxk_battle_result";
const BATTLE_REWARD_APPLIED_KEY = "bxk_battle_reward_applied";

type BattleSetup = {
  mode: BattleMode;
  playerDeck: FighterCard[];
  enemyDeck: FighterCard[];
};

export function saveBattleSetup(setup: BattleSetup) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATTLE_SETUP_KEY, JSON.stringify(setup));
  localStorage.removeItem(BATTLE_RESULT_KEY);
  localStorage.removeItem(BATTLE_REWARD_APPLIED_KEY);
}

export function loadBattleSetup(): BattleSetup | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(BATTLE_SETUP_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as BattleSetup;
  } catch {
    return null;
  }
}

export function clearBattleSetup() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BATTLE_SETUP_KEY);
}

export function saveBattleResult(result: BattleResultData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATTLE_RESULT_KEY, JSON.stringify(result));
}

export function loadBattleResult(): BattleResultData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(BATTLE_RESULT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as BattleResultData;
  } catch {
    return null;
  }
}

export function clearBattleResult() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BATTLE_RESULT_KEY);
}

export function isBattleRewardApplied(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BATTLE_REWARD_APPLIED_KEY) === "true";
}

export function markBattleRewardApplied() {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATTLE_REWARD_APPLIED_KEY, "true");
}

export function clearBattleRewardApplied() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BATTLE_REWARD_APPLIED_KEY);
}