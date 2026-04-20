import type { FighterCard } from "@/types/game";
import type { BattleMode, BattleResultData } from "@/lib/battleTypes";
import { simulateStateBattle } from "@/lib/battleEngine";

export type { BattleMode, BattleResultData };

export function simulateBattle(
  mode: BattleMode,
  playerDeck: FighterCard[],
  enemyDeck: FighterCard[]
): BattleResultData<FighterCard> {
  return simulateStateBattle(mode, playerDeck, enemyDeck);
}