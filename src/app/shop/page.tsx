"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import {
  glassCard,
  primaryButton,
  secondaryButton,
} from "@/components/ui";
import { getWalletCoins, spendWalletCoins } from "@/lib/walletStorage";
import { openEliteBanner, openStandardPack } from "@/lib/packOpening";
import {
  addOwnedCard,
  getDuplicateShardValue,
  hasOwnedCard,
  seedStarterCollection,
} from "@/lib/collectionStorage";
import { savePendingPackReveal } from "@/lib/packRevealStorage";
import { playClickSfx } from "@/lib/sfx";
import type { FighterCard } from "@/types/game";

export default function ShopPage() {
  const router = useRouter();

  const [coins, setCoins] = useState(0);
  const [message, setMessage] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    seedStarterCollection();
    setCoins(getWalletCoins());
  }, []);

  function processOpenedCard(card: FighterCard, source: "standard" | "elite") {
    const alreadyOwned = hasOwnedCard(card.id);

    if (!alreadyOwned) {
      addOwnedCard(card.id, 1);

      savePendingPackReveal({
        source,
        card,
        outcome: "new",
        coinCompensation: 0,
        openedAt: Date.now(),
      });

      router.push("/shop/opening");
      return;
    }

    const compensation = getDuplicateShardValue(card.rarity);

    savePendingPackReveal({
      source,
      card,
      outcome: "duplicate",
      coinCompensation: compensation,
      openedAt: Date.now(),
    });

    router.push("/shop/opening");
  }

  function handleOpenStandardPack() {
    if (isOpening) return;

    const result = spendWalletCoins(100);
    if (!result.ok) {
      setMessage("Not enough coins for Standard Pack.");
      return;
    }

    playClickSfx();
    setIsOpening(true);
    setCoins(result.balance);

    const card = openStandardPack();
    processOpenedCard(card, "standard");
  }

  function handleOpenEliteBanner() {
    if (isOpening) return;

    const result = spendWalletCoins(350);
    if (!result.ok) {
      setMessage("Not enough coins for Elite Banner.");
      return;
    }

    playClickSfx();
    setIsOpening(true);
    setCoins(result.balance);

    const card = openEliteBanner();
    processOpenedCard(card, "elite");
  }

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>Shop</div>
              <div style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
                Packs, banners and future event drops
              </div>
            </div>

            <div
              style={{
                ...glassCard(),
                padding: "10px 14px",
                borderRadius: 18,
                minWidth: 110,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                Balance
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{coins} Coins</div>
            </div>
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            Featured
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
            Arena Legends Pack
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            Higher chance for Legendary and God-like fighters.
          </div>
          <button
            onClick={handleOpenEliteBanner}
            disabled={isOpening}
            style={{
              ...primaryButton(),
              width: "100%",
              marginTop: 16,
              opacity: isOpening ? 0.7 : 1,
            }}
          >
            {isOpening ? "Opening..." : "Open Elite Banner"}
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Standard Pack</div>
            <div
              style={{
                marginTop: 8,
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
              }}
            >
              100 Coins
            </div>
            <button
              onClick={handleOpenStandardPack}
              disabled={isOpening}
              style={{
                ...secondaryButton(),
                width: "100%",
                marginTop: 16,
                opacity: isOpening ? 0.7 : 1,
              }}
            >
              {isOpening ? "Opening..." : "Buy"}
            </button>
          </div>

          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Elite Banner</div>
            <div
              style={{
                marginTop: 8,
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
              }}
            >
              350 Coins
            </div>
            <button
              onClick={handleOpenEliteBanner}
              disabled={isOpening}
              style={{
                ...secondaryButton(),
                width: "100%",
                marginTop: 16,
                opacity: isOpening ? 0.7 : 1,
              }}
            >
              {isOpening ? "Opening..." : "Buy"}
            </button>
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
            Shop Status
          </div>
          <div style={{ color: "rgba(255,255,255,0.72)" }}>
            {message || "Buy a pack to launch the reveal sequence."}
          </div>
        </div>
      </div>
    </PageShell>
  );
}