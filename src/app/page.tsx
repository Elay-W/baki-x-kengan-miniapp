"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import SplashScreen from "@/components/SplashScreen";
import { glassCard, secondaryButton } from "@/components/ui";
import { useRouter } from "next/navigation";
import { loadDeck } from "@/lib/deckStorage";
import { getWalletCoins } from "@/lib/walletStorage";
import { getOwnedCardsDetailed, seedStarterCollection } from "@/lib/collectionStorage";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(8);
  const [coins, setCoins] = useState(500);
  const [ownedCount, setOwnedCount] = useState(0);
  const [activeDeck, setActiveDeck] = useState<string[]>([
    "Yujiro Hanma",
    "Baki Hanma",
    "Tokita Ohma",
  ]);

  useEffect(() => {
    seedStarterCollection();

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : Math.min(prev + 7, 100)));
    }, 120);

    const timeout = setTimeout(() => {
      setProgress(100);
      setLoading(false);
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const storedDeck = loadDeck();
    if (storedDeck.length > 0) {
      setActiveDeck(storedDeck.map((card) => card.name));
    }

    setCoins(getWalletCoins());
    setOwnedCount(getOwnedCardsDetailed().length);
  }, []);

  return (
    <>
      {loading && <SplashScreen progress={progress} />}

      {!loading && (
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
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.05 }}>
                Baki X Kengan
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 16,
                  color: "#a1a1aa",
                  lineHeight: 1.5,
                }}
              >
                Collect fighter cards, build your deck, and dominate the arena.
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
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

              <button style={secondaryButton()} onClick={() => router.push("/profile")}>
                Profile
              </button>
            </div>
          </div>

          <div style={{ ...glassCard(), padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: "#a1a1aa" }}>Current deck</div>
                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>
                  Main Arena Deck
                </div>
              </div>

              <button style={secondaryButton()} onClick={() => router.push("/deck")}>
                Open
              </button>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {activeDeck.length > 0 ? (
                activeDeck.map((name) => (
                  <span
                    key={name}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                      fontSize: 12,
                      color: "#d4d4d8",
                    }}
                  >
                    {name}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 13, color: "#71717a" }}>No saved deck yet</span>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Collection", `Owned fighters: ${ownedCount}`, "/collection"],
              ["Decks", "Manage your battle-ready builds", "/deck"],
              ["Battle", "Choose a mode and enter the arena", "/battle"],
              ["Shop", "Open packs and get new cards", "/shop"],
            ].map(([title, subtitle, href]) => (
              <button
                key={title}
                onClick={() => router.push(href)}
                style={{
                  ...glassCard(),
                  padding: 18,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: "#a1a1aa",
                    lineHeight: 1.45,
                  }}
                >
                  {subtitle}
                </div>
              </button>
            ))}
          </div>

          <div style={{ ...glassCard(), padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Daily focus</div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>
              Win 3 battles • Open 1 pack • Add 1 card to favourites
            </div>
          </div>
        </PageShell>
      )}
    </>
  );
}