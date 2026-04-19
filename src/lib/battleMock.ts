import type { FighterCard } from "@/types/game";

export type BattleMode = "Ranked" | "Casual" | "Training";

export type BattleResultData = {
  mode: BattleMode;
  playerDeck: FighterCard[];
  enemyDeck: FighterCard[];
  playerScore: number;
  enemyScore: number;
  winner: "player" | "enemy";
  mvp: FighterCard | null;
  rewardCoins: number;
};

function getCardPower(card: FighterCard): number {
  const base =
    card.stats.STR * 1.2 +
    card.stats.SPD * 1.0 +
    card.stats.TECH * 1.15 +
    card.stats.DUR * 1.1 +
    card.stats.DEF * 1.0 +
    card.stats.INSTINCT * 1.15;

  const rarityBonusMap: Record<string, number> = {
    Common: 0,
    Uncommon: 10,
    Rare: 20,
    Epic: 35,
    Elite: 50,
    Legendary: 70,
    "God-like": 95,
  };

  const typeBonusMap: Record<string, number> = {
    Powerhouse: 14,
    Tank: 12,
    Speedster: 10,
    Technician: 13,
    Wildcard: 16,
  };

  const rarityBonus = rarityBonusMap[card.rarity] ?? 0;
  const typeBonus = typeBonusMap[card.type] ?? 0;

  return Math.round(base + rarityBonus + typeBonus);
}

function getDeckScore(deck: FighterCard[]): number {
  return deck.reduce((sum, card) => sum + getCardPower(card), 0);
}

function getMvp(playerDeck: FighterCard[], enemyDeck: FighterCard[], winner: "player" | "enemy") {
  const source = winner === "player" ? playerDeck : enemyDeck;
  if (!source.length) return null;

  return [...source].sort((a, b) => getCardPower(b) - getCardPower(a))[0] ?? null;
}

export function simulateBattle(
  mode: BattleMode,
  playerDeck: FighterCard[],
  enemyDeck: FighterCard[]
): BattleResultData {
  const modeBonus =
    mode === "Ranked" ? 1.04 : mode === "Casual" ? 1.0 : 0.96;

  const playerBase = getDeckScore(playerDeck);
  const enemyBase = getDeckScore(enemyDeck);

  const playerRandom = 0.92 + Math.random() * 0.16;
  const enemyRandom = 0.92 + Math.random() * 0.16;

  const playerScore = Math.round(playerBase * modeBonus * playerRandom);
  const enemyScore = Math.round(enemyBase * enemyRandom);

  const winner = playerScore >= enemyScore ? "player" : "enemy";
  const mvp = getMvp(playerDeck, enemyDeck, winner);

 const rewardCoins =
  winner === "player"
    ? mode === "Ranked"
      ? 120
      : mode === "Casual"
      ? 80
      : 45
    : mode === "Ranked"
    ? -35
    : mode === "Casual"
    ? -15
    : 0;

  return {
    mode,
    playerDeck,
    enemyDeck,
    playerScore,
    enemyScore,
    winner,
    mvp,
    rewardCoins,
  };
}