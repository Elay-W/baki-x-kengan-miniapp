import type { FighterCard } from "@/types/game";
import type { BattleMode, BattleResultData, BattleSetupData } from "@/lib/battleTypes";

const BATTLE_SETUP_KEY = "bxk_battle_setup";
const BATTLE_RESULT_KEY = "bxk_battle_result";
const BATTLE_REWARD_APPLIED_KEY = "bxk_battle_reward_applied";

export function saveBattleSetup(
  data: BattleSetupData<FighterCard>
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATTLE_SETUP_KEY, JSON.stringify(data));
  localStorage.removeItem(BATTLE_RESULT_KEY);
  localStorage.removeItem(BATTLE_REWARD_APPLIED_KEY);
}

export function loadBattleSetup(): BattleSetupData<FighterCard> | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(BATTLE_SETUP_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as BattleSetupData<FighterCard>;
  } catch {
    return null;
  }
}

export function clearBattleSetup() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BATTLE_SETUP_KEY);
}

export function saveBattleResult(
  data: BattleResultData<FighterCard>
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATTLE_RESULT_KEY, JSON.stringify(data));
}

export function loadBattleResult(): BattleResultData<FighterCard> | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(BATTLE_RESULT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as BattleResultData<FighterCard>;
  } catch {
    return null;
  }
}

export function clearBattleResult() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BATTLE_RESULT_KEY);
}

export function isBattleRewardApplied() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BATTLE_REWARD_APPLIED_KEY) === "1";
}

export function markBattleRewardApplied() {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATTLE_REWARD_APPLIED_KEY, "1");
}

export function resetBattleRewardApplied() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BATTLE_REWARD_APPLIED_KEY);
}