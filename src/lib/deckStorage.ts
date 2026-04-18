import { cards } from "@/data/cards";
import type { FighterCard } from "@/types/game";

const STORAGE_KEY = "bxk_main_deck_ids";

export function saveDeck(cardIds: number[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cardIds));
}

export function loadDeck(): FighterCard[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const ids: number[] = JSON.parse(raw);
    return ids
      .map((id) => cards.find((card) => card.id === id))
      .filter(Boolean) as FighterCard[];
  } catch {
    return [];
  }
}

export function clearSavedDeck() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}