"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton, rarityColors } from "@/components/ui";
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

    router.push("/battle/result");
  }

  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>Battle Setup</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Choose a mode, review your deck, and enter the arena
        </div>
      </div>

      <div style={{ ...glassCard(), padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Mode Select</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Pick how you want to fight
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
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

      <div style={{ ...glassCard(), padding: 20, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Your Deck</div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
              Saved main arena deck
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: isDeckReady ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
              color: isDeckReady ? "#86efac" : "#d4d4d8",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {deck.length}/5
          </div>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {deck.length > 0 ? (
            deck.map((card, index) => {
              const tone = rarityColors(card.rarity);

              return (
                <div
                  key={`player-${card.id}-${index}`}
                  style={{
                    minHeight: 72,
                    borderRadius: 18,
                    border: `1px solid ${tone.border}`,
                    background: tone.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{card.name}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#d4d4d8" }}>
                      {card.rarity} • {card.type} • {card.universe}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: tone.text }}>{card.stars}★</div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                minHeight: 74,
                borderRadius: 18,
                border: "1px dashed rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.02)",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                color: "#71717a",
                fontSize: 14,
              }}
            >
              No saved deck found.
            </div>
          )}
        </div>
      </div>

      <div style={{ ...glassCard(), padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Enemy Preview</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Opponent lineup for {mode} mode
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {enemyTeam.map((card, index) => {
            const tone = rarityColors(card.rarity);

            return (
              <div
                key={`enemy-${card.id}-${index}`}
                style={{
                  minHeight: 72,
                  borderRadius: 18,
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 14px",
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{card.name}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#d4d4d8" }}>
                    {card.rarity} • {card.type} • {card.universe}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: tone.text }}>{card.stars}★</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...glassCard(), padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Ready Check</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Enter the arena when your deck is complete
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <button style={primaryButton()} onClick={handleStartBattle}>
            Start Battle
          </button>

          <button
            style={secondaryButton()}
            onClick={() => {
              setMessage("");
            }}
          >
            Reset
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            color: message ? "#fca5a5" : "#a1a1aa",
          }}
        >
          {message || "Choose a mode and begin."}
        </div>
      </div>
    </PageShell>
  );
}