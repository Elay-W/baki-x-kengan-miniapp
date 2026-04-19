import { cards } from "@/data/cards";
import type { FighterCard } from "@/types/game";

const STORAGE_KEY = "bxk_main_deck_ids";
const DECK_SIZE = 5;

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

export function addCardToSavedDeck(cardId: number): {
  ok: boolean;
  reason?: "duplicate" | "full" | "not_found";
} {
  const deck = loadDeck();

  const exists = deck.some((card) => card.id === cardId);
  if (exists) {
    return { ok: false, reason: "duplicate" };
  }

  if (deck.length >= DECK_SIZE) {
    return { ok: false, reason: "full" };
  }

  const card = cards.find((item) => item.id === cardId);
  if (!card) {
    return { ok: false, reason: "not_found" };
  }

  saveDeck([...deck.map((c) => c.id), cardId]);
  return { ok: true };
}