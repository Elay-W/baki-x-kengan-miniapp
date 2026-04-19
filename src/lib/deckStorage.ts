"use client";

import { cards } from "@/data/cards";
import type { FighterCard } from "@/types/game";
import { hasOwnedCard } from "@/lib/collectionStorage";

const STORAGE_KEY = "bxk_main_deck_ids";
const DECK_SIZE = 5;

export function getSavedDeckIds(): number[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

export function saveDeck(cardIds: number[]) {
  if (typeof window === "undefined") return;

  const cleaned = Array.from(new Set(cardIds))
    .filter((id) => cards.some((card) => card.id === id))
    .filter((id) => hasOwnedCard(id))
    .slice(0, DECK_SIZE);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

export function loadDeck(): FighterCard[] {
  const ids = syncSavedDeckWithCollection();

  return ids
    .map((id) => cards.find((card) => card.id === id))
    .filter(Boolean) as FighterCard[];
}

export function clearSavedDeck() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function removeCardFromSavedDeck(cardId: number) {
  const current = getSavedDeckIds();
  const next = current.filter((id) => id !== cardId);
  saveDeck(next);
}

export function syncSavedDeckWithCollection(): number[] {
  const current = getSavedDeckIds();

  const cleaned = Array.from(new Set(current))
    .filter((id) => cards.some((card) => card.id === id))
    .filter((id) => hasOwnedCard(id))
    .slice(0, DECK_SIZE);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }

  return cleaned;
}

export function addCardToSavedDeck(
  cardId: number
): { ok: boolean; reason?: "duplicate" | "full" | "not_found" | "not_owned" } {
  const currentIds = syncSavedDeckWithCollection();

  if (currentIds.includes(cardId)) {
    return { ok: false, reason: "duplicate" };
  }

  if (currentIds.length >= DECK_SIZE) {
    return { ok: false, reason: "full" };
  }

  const card = cards.find((item) => item.id === cardId);
  if (!card) {
    return { ok: false, reason: "not_found" };
  }

  if (!hasOwnedCard(cardId)) {
    return { ok: false, reason: "not_owned" };
  }

  saveDeck([...currentIds, cardId]);
  return { ok: true };
}