"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import {
  glassCard,
  primaryButton,
  secondaryButton,
  rarityColors,
} from "@/components/ui";
import { loadDeck } from "@/lib/deckStorage";
import { saveBattleSetup } from "@/lib/battleStorage";
import type { FighterCard } from "@/types/game";
import { cards } from "@/data/cards";
import type { BattleMode } from "@/lib/battleMock";

const enemyPools: Record<BattleMode, number[]> = {
  Ranked: [2, 5, 6, 7, 8],
  Casual: [4, 5, 8],
  Training: [6, 8],
};

export default function BattlePage() {
  const router = useRouter();

  const [mode, setMode] = useState<BattleMode>("Casual");
  const [deck, setDeck] = useState<FighterCard[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedDeck = loadDeck();
    setDeck(storedDeck);
  }, []);

  const enemyTeam = useMemo(() => {
    const ids = enemyPools[mode];
    return ids
      .map((id) => cards.find((card) => card.id === id))
      .filter(Boolean) as FighterCard[];
  }, [mode]);

  const isDeckReady = deck.length === 5;

  function handleStartBattle() {
    if (!isDeckReady) {
      setMessage("Your deck is incomplete. Build a full 5-card deck first.");
      return;
    }

    saveBattleSetup({
      mode,
      playerDeck: deck,
      enemyDeck: enemyTeam,
    });

    router.push("/battle/versus");
  }

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 900 }}>Battle Setup</div>
          <div
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.5,
            }}
          >
            Choose a mode, review your deck, and enter the arena.
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Mode Select</div>
          <div
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,0.66)",
            }}
          >
            Pick how you want to fight.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {(["Ranked", "Casual", "Training"] as BattleMode[]).map((item) => {
              const active = mode === item;

              return (
                <button
                  key={item}
                  onClick={() => {
                    setMode(item);
                    setMessage("");
                  }}
                  style={{
                    padding: "14px 12px",
                    borderRadius: 16,
                    border: active
                      ? "1px solid rgba(255,255,255,0.18)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: active ? "#ffffff" : "rgba(255,255,255,0.04)",
                    color: active ? "#000000" : "#ffffff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Your Deck</div>
              <div
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,0.66)",
                }}
              >
                Saved main arena deck.
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: `1px solid ${
                  isDeckReady
                    ? "rgba(34,197,94,0.35)"
                    : "rgba(255,255,255,0.12)"
                }`,
                background: isDeckReady
                  ? "rgba(34,197,94,0.18)"
                  : "rgba(255,255,255,0.05)",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {deck.length}/5
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {deck.length > 0 ? (
              deck.map((card) => {
                const tone = rarityColors(card.rarity);

                return (
                  <div
                    key={card.id}
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      border: `1px solid ${tone.border}`,
                      background: tone.bg,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>
                          {card.name}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            color: "rgba(255,255,255,0.72)",
                          }}
                        >
                          {card.rarity} • {card.type} • {card.universe}
                        </div>
                      </div>

                      <div style={{ fontWeight: 900, fontSize: 18 }}>
                        {card.stars}★
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                No saved deck found.
              </div>
            )}
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Enemy Preview</div>
          <div
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,0.66)",
            }}
          >
            Opponent lineup for {mode} mode.
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {enemyTeam.map((card) => {
              const tone = rarityColors(card.rarity);

              return (
                <div
                  key={card.id}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    border: `1px solid ${tone.border}`,
                    background: tone.bg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>
                        {card.name}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          color: "rgba(255,255,255,0.72)",
                        }}
                      >
                        {card.rarity} • {card.type} • {card.universe}
                      </div>
                    </div>

                    <div style={{ fontWeight: 900, fontSize: 18 }}>
                      {card.stars}★
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Ready Check</div>
          <div
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,0.66)",
            }}
          >
            Enter the arena when your deck is complete.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <button onClick={handleStartBattle} style={primaryButton()}>
              Start Battle
            </button>

            <button
              onClick={() => {
                setMode("Casual");
                setMessage("");
              }}
              style={secondaryButton()}
            >
              Reset
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              color: message ? "#fca5a5" : "rgba(255,255,255,0.68)",
            }}
          >
            {message || "Choose a mode and begin."}
          </div>
        </div>
      </div>
    </PageShell>
  );
}