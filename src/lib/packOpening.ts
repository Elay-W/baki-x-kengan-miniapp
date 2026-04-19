import { cards } from "@/data/cards";
import type { FighterCard, Rarity } from "@/types/game";

function randomFromPool<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

function cardsByRarity(rarity: Rarity): FighterCard[] {
  return cards.filter((card) => card.rarity === rarity);
}

function fallbackCard(): FighterCard {
  return cards[0];
}

export function openStandardPack(): FighterCard {
  const roll = Math.random();

  let rarity: Rarity;

  if (roll < 0.40) rarity = "Rare";
  else if (roll < 0.68) rarity = "Epic";
  else if (roll < 0.86) rarity = "Elite";
  else if (roll < 0.97) rarity = "Legendary";
  else rarity = "God-like";

  const pool = cardsByRarity(rarity);
  return pool.length ? randomFromPool(pool) : fallbackCard();
}

export function openEliteBanner(): FighterCard {
  const roll = Math.random();

  let rarity: Rarity;

  if (roll < 0.45) rarity = "Elite";
  else if (roll < 0.82) rarity = "Legendary";
  else rarity = "God-like";

  const pool = cardsByRarity(rarity);
  return pool.length ? randomFromPool(pool) : fallbackCard();
}