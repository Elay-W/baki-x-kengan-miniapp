const WALLET_KEY = "bxk_wallet_coins";

const DEFAULT_COINS = 500;

export function getWalletCoins(): number {
  if (typeof window === "undefined") return DEFAULT_COINS;

  const raw = localStorage.getItem(WALLET_KEY);
  if (!raw) {
    localStorage.setItem(WALLET_KEY, String(DEFAULT_COINS));
    return DEFAULT_COINS;
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    localStorage.setItem(WALLET_KEY, String(DEFAULT_COINS));
    return DEFAULT_COINS;
  }

  return parsed;
}

export function setWalletCoins(value: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALLET_KEY, String(Math.max(0, Math.round(value))));
}

export function addWalletCoins(delta: number): number {
  const current = getWalletCoins();
  const next = Math.max(0, current + delta);
  setWalletCoins(next);
  return next;
}

export function spendWalletCoins(amount: number): {
  ok: boolean;
  balance: number;
} {
  const current = getWalletCoins();

  if (current < amount) {
    return { ok: false, balance: current };
  }

  const next = current - amount;
  setWalletCoins(next);
  return { ok: true, balance: next };
}

export function resetWalletCoins() {
  if (typeof window === "undefined") return;
  localStorage.setItem(WALLET_KEY, String(DEFAULT_COINS));
}