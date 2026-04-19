import { cards } from "@/data/cards";
import type { FighterCard, Rarity } from "@/types/game";

const COLLECTION_KEY = "bxk_owned_cards";

export type OwnedCardsMap = Record<number, number>;

export function getOwnedCardsMap(): OwnedCardsMap {
  if (typeof window === "undefined") return {};

  const raw = localStorage.getItem(COLLECTION_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as OwnedCardsMap;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function saveOwnedCardsMap(map: OwnedCardsMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(map));
}

export function addOwnedCard(cardId: number, amount = 1): number {
  const map = getOwnedCardsMap();
  const current = map[cardId] ?? 0;
  const next = current + amount;
  map[cardId] = next;
  saveOwnedCardsMap(map);
  return next;
}

export function getOwnedCopies(cardId: number): number {
  const map = getOwnedCardsMap();
  return map[cardId] ?? 0;
}

export function hasOwnedCard(cardId: number): boolean {
  return getOwnedCopies(cardId) > 0;
}

export function getDuplicateShardValue(rarity: Rarity): number {
  switch (rarity) {
    case "Rare":
      return 20;
    case "Epic":
      return 35;
    case "Elite":
      return 55;
    case "Legendary":
      return 75;
    case "God-like":
      return 90;
    case "Uncommon":
      return 12;
    case "Common":
    default:
      return 8;
  }
}

export function getOwnedCardsDetailed(): Array<FighterCard & { copies: number }> {
  const map = getOwnedCardsMap();

  return Object.entries(map)
    .map(([id, copies]) => {
      const card = cards.find((item) => item.id === Number(id));
      if (!card) return null;
      return {
        ...card,
        copies,
      };
    })
    .filter(Boolean) as Array<FighterCard & { copies: number }>;
}

export function seedStarterCollection() {
  const current = getOwnedCardsMap();
  if (Object.keys(current).length > 0) return;

  const starterIds = [1, 3, 4, 5, 6, 7, 8];
  const map: OwnedCardsMap = {};

  for (const id of starterIds) {
    map[id] = 1;
  }

  saveOwnedCardsMap(map);
}