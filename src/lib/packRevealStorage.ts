import type { FighterCard } from "@/types/game";

const PACK_REVEAL_KEY = "bxk_pending_pack_reveal";

export type PackRevealSource = "standard" | "elite";

export type PendingPackReveal = {
  source: PackRevealSource;
  card: FighterCard;
  outcome: "new" | "duplicate";
  coinCompensation: number;
  openedAt: number;
};

export function savePendingPackReveal(data: PendingPackReveal) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PACK_REVEAL_KEY, JSON.stringify(data));
}

export function getPendingPackReveal(): PendingPackReveal | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(PACK_REVEAL_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingPackReveal;
    if (!parsed?.card?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPackReveal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PACK_REVEAL_KEY);
}