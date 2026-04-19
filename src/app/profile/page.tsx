"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton } from "@/components/ui";
import { getWalletCoins } from "@/lib/walletStorage";
import { getOwnedCardsDetailed } from "@/lib/collectionStorage";
import { loadDeck } from "@/lib/deckStorage";

export default function ProfilePage() {
  const router = useRouter();

  const [coins, setCoins] = useState(0);
  const [ownedCount, setOwnedCount] = useState(0);
  const [deckCount, setDeckCount] = useState(0);

  useEffect(() => {
    setCoins(getWalletCoins());
    setOwnedCount(getOwnedCardsDetailed().length);
    setDeckCount(loadDeck().length);
  }, []);

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Fighter Profile
          </div>

          <div style={{ marginTop: 8, fontSize: 34, fontWeight: 900 }}>
            Profile
          </div>

          <div
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.5,
            }}
          >
            Review your current game status, collection progress and system access.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              Wallet
            </div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
              {coins}
            </div>
            <div
              style={{
                marginTop: 6,
                color: "rgba(255,255,255,0.68)",
              }}
            >
              Coins available
            </div>
          </div>

          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              Collection
            </div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
              {ownedCount}
            </div>
            <div
              style={{
                marginTop: 6,
                color: "rgba(255,255,255,0.68)",
              }}
            >
              Owned fighters
            </div>
          </div>

          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              Main Deck
            </div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900 }}>
              {deckCount}/5
            </div>
            <div
              style={{
                marginTop: 6,
                color: "rgba(255,255,255,0.68)",
              }}
            >
              Deck readiness
            </div>
          </div>

          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              Status
            </div>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900 }}>
              Active
            </div>
            <div
              style={{
                marginTop: 6,
                color: "rgba(255,255,255,0.68)",
              }}
            >
              Arena profile online
            </div>
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>System Access</div>
          <div
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.5,
            }}
          >
            Open the game settings hub to prepare future controls for audio,
            visuals, gameplay and data tools.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <button onClick={() => router.push("/settings")} style={primaryButton()}>
              Open Settings
            </button>
            <button onClick={() => router.push("/")} style={secondaryButton()}>
              Back Home
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}