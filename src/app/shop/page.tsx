"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, rarityColors, secondaryButton } from "@/components/ui";
import { addWalletCoins, getWalletCoins, spendWalletCoins } from "@/lib/walletStorage";
import { openEliteBanner, openStandardPack } from "@/lib/packOpening";
import type { FighterCard } from "@/types/game";
import {
  addOwnedCard,
  getDuplicateShardValue,
  hasOwnedCard,
  seedStarterCollection,
} from "@/lib/collectionStorage";

type OpenResultState =
  | {
      type: "new";
      card: FighterCard;
    }
  | {
      type: "duplicate";
      card: FighterCard;
      coinCompensation: number;
    }
  | null;

export default function ShopPage() {
  const [coins, setCoins] = useState(0);
  const [message, setMessage] = useState("");
  const [openedResult, setOpenedResult] = useState<OpenResultState>(null);

  useEffect(() => {
    seedStarterCollection();
    setCoins(getWalletCoins());
  }, []);

  function processOpenedCard(card: FighterCard) {
    const alreadyOwned = hasOwnedCard(card.id);

    if (!alreadyOwned) {
      addOwnedCard(card.id, 1);
      setOpenedResult({
        type: "new",
        card,
      });
      return;
    }

    const compensation = getDuplicateShardValue(card.rarity);
    const updatedBalance = addWalletCoins(compensation);

    setCoins(updatedBalance);
    setOpenedResult({
      type: "duplicate",
      card,
      coinCompensation: compensation,
    });
  }

  function handleOpenStandardPack() {
    const result = spendWalletCoins(100);

    if (!result.ok) {
      setMessage("Not enough coins for Standard Pack.");
      return;
    }

    const card = openStandardPack();

    setCoins(result.balance);
    processOpenedCard(card);
    setMessage("Standard Pack opened successfully.");
  }

  function handleOpenEliteBanner() {
    const result = spendWalletCoins(350);

    if (!result.ok) {
      setMessage("Not enough coins for Elite Banner.");
      return;
    }

    const card = openEliteBanner();

    setCoins(result.balance);
    processOpenedCard(card);
    setMessage("Elite Banner opened successfully.");
  }

  const tone = openedResult ? rarityColors(openedResult.card.rarity) : null;

  return (
    <PageShell>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>Shop</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
            Packs, banners and future event drops
          </div>
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "#fef08a",
            fontWeight: 700,
            fontSize: 14,
            textAlign: "center",
            minWidth: 110,
          }}
        >
          {coins} Coins
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            padding: 20,
            borderRadius: 24,
            border: "1px solid rgba(251,146,60,0.35)",
            background: "rgba(154,52,18,0.18)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#fdba74",
            }}
          >
            Featured
          </div>

          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>
            Arena Legends Pack
          </div>

          <div style={{ marginTop: 8, fontSize: 14, color: "#d4d4d8", lineHeight: 1.45 }}>
            Higher chance for Legendary and God-like fighters.
          </div>

          <button style={{ ...primaryButton(), marginTop: 18 }} onClick={handleOpenEliteBanner}>
            Open Elite Banner
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ ...glassCard(), padding: 18 }}>
            <div style={{ fontSize: 14, color: "#a1a1aa" }}>Standard Pack</div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>100 Coins</div>
            <button
              style={{ ...secondaryButton(), marginTop: 14, width: "100%" }}
              onClick={handleOpenStandardPack}
            >
              Buy
            </button>
          </div>

          <div style={{ ...glassCard(), padding: 18 }}>
            <div style={{ fontSize: 14, color: "#a1a1aa" }}>Elite Banner</div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>350 Coins</div>
            <button
              style={{ ...secondaryButton(), marginTop: 14, width: "100%" }}
              onClick={handleOpenEliteBanner}
            >
              Buy
            </button>
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Shop Status</div>
          <div
            style={{
              marginTop: 10,
              fontSize: 14,
              color: message.includes("successfully") ? "#86efac" : "#a1a1aa",
            }}
          >
            {message || "Buy a pack to reveal a fighter."}
          </div>
        </div>

        {openedResult && tone && (
          <div
            style={{
              padding: 20,
              borderRadius: 24,
              border: `1px solid ${tone.border}`,
              background: tone.bg,
            }}
          >
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Pack Result</div>

            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>
              {openedResult.card.name}
            </div>

            <div style={{ marginTop: 6, fontSize: 16, color: "#d4d4d8" }}>
              {openedResult.card.title}
            </div>

            <div style={{ marginTop: 14, fontSize: 14, color: tone.text }}>
              {openedResult.card.rarity} • {openedResult.card.type} • {openedResult.card.universe}
            </div>

            <div style={{ marginTop: 14, fontSize: 14, color: "#d4d4d8", lineHeight: 1.5 }}>
              {openedResult.card.skill}
            </div>

            <div style={{ marginTop: 16, fontSize: 15, color: "#fff", fontWeight: 600 }}>
              {openedResult.type === "new"
                ? "New fighter added to your collection."
                : `Duplicate converted into +${openedResult.coinCompensation} Coins.`}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}