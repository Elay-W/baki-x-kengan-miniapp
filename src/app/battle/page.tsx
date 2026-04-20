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
import { cards } from "@/data/cards";
import { saveBattleSetup } from "@/lib/battleStorage";
import { loadDeck } from "@/lib/deckStorage";
import type { BattleMode } from "@/lib/battleMock";
import type { FighterCard } from "@/types/game";

const enemyPools: Record<BattleMode, number[]> = {
  Ranked: [2, 5, 6, 7, 8],
  Casual: [4, 5, 8],
  Training: [6, 8],
};

type BattleHubMode = "auto-arena" | "arena-clash";

export default function BattlePage() {
  const router = useRouter();

  const [hubMode, setHubMode] = useState<BattleHubMode>("auto-arena");
  const [autoMode, setAutoMode] = useState<BattleMode>("Casual");
  const [deck, setDeck] = useState<FighterCard[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedDeck = loadDeck();
    setDeck(storedDeck);
  }, []);

  const enemyTeam = useMemo(() => {
    const ids = enemyPools[autoMode];
    return ids
      .map((id) => cards.find((card) => card.id === id))
      .filter(Boolean) as FighterCard[];
  }, [autoMode]);

  const isDeckReady = deck.length === 5;

  function handleStartAutoBattle() {
    if (!isDeckReady) {
      setMessage("Your deck is incomplete. Build a full 5-card deck first.");
      return;
    }

    saveBattleSetup({
      mode: autoMode,
      playerDeck: deck,
      enemyDeck: enemyTeam,
    });

    router.push("/battle/versus");
  }

  function handleStartArenaClash() {
    if (!isDeckReady) {
      setMessage("Your deck is incomplete. Build a full 5-card deck first.");
      return;
    }

    router.push("/battle/arena-clash");
  }

  function renderDeckCard(card: FighterCard) {
    const tone = rarityColors(card.rarity);

    return (
      <div
        key={card.id}
        style={{
          ...glassCard(),
          padding: 12,
          display: "grid",
          gap: 6,
          border: `1px solid ${tone.border}`,
          background: tone.bg,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 800 }}>{card.name}</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: tone.text,
              whiteSpace: "nowrap",
            }}
          >
            {card.stars}★
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.72 }}>
          {card.rarity} • {card.type} • {card.universe}
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <main
        style={{
          padding: "16px 16px 120px",
          display: "grid",
          gap: 16,
        }}
      >
        <section
          style={{
            ...glassCard(),
            padding: 18,
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Battle Hub
          </div>

          <div style={{ fontSize: 28, fontWeight: 900 }}>Choose Your Arena</div>

          <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.76, maxWidth: 860 }}>
            Auto Arena stays as the faster battle mode, while Arena Clash is the deeper
            tactical mode with manual actions and skill timing.
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setHubMode("auto-arena");
              setMessage("");
            }}
            style={{
              ...glassCard(),
              padding: 18,
              textAlign: "left",
              display: "grid",
              gap: 10,
              cursor: "pointer",
              border:
                hubMode === "auto-arena"
                  ? "1px solid rgba(255,255,255,0.18)"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                hubMode === "auto-arena"
                  ? "rgba(255,255,255,0.09)"
                  : "rgba(255,255,255,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Fast Mode
            </div>

            <div style={{ fontSize: 24, fontWeight: 900 }}>Auto Arena</div>

            <div style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.74 }}>
              Quick battle setup with Ranked, Casual, and Training presets. Best for fast
              matches and lightweight progression.
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setHubMode("arena-clash");
              setMessage("");
            }}
            style={{
              ...glassCard(),
              padding: 18,
              textAlign: "left",
              display: "grid",
              gap: 10,
              cursor: "pointer",
              border:
                hubMode === "arena-clash"
                  ? "1px solid rgba(255,255,255,0.18)"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                hubMode === "arena-clash"
                  ? "rgba(255,255,255,0.09)"
                  : "rgba(255,255,255,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Tactical Mode
            </div>

            <div style={{ fontSize: 24, fontWeight: 900 }}>Arena Clash</div>

            <div style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.74 }}>
              A deeper 5v5 stat-clash mode with manual actions, Focus, Tempo, switching,
              and manually activated signature skills.
            </div>
          </button>
        </section>

        <section
          style={{
            ...glassCard(),
            padding: 16,
            display: "grid",
            gap: 14,
          }}
        >
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
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Your Deck
              </div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Saved Main Team</div>
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {deck.length}/5
            </div>
          </div>

          {deck.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {deck.map(renderDeckCard)}
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 14,
                fontSize: 14,
                opacity: 0.72,
              }}
            >
              No saved deck found.
            </div>
          )}
        </section>

        {hubMode === "auto-arena" ? (
          <>
            <section
              style={{
                ...glassCard(),
                padding: 16,
                display: "grid",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.6,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  Auto Arena
                </div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Mode Select</div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                {(["Ranked", "Casual", "Training"] as BattleMode[]).map((item) => {
                  const active = autoMode === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setAutoMode(item);
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
            </section>

            <section
              style={{
                ...glassCard(),
                padding: 16,
                display: "grid",
                gap: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.6,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  Enemy Preview
                </div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  Opponent Lineup for {autoMode}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                {enemyTeam.map(renderDeckCard)}
              </div>
            </section>

            <section
              style={{
                ...glassCard(),
                padding: 16,
                display: "grid",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.6,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  Ready Check
                </div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>Enter Auto Arena</div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={handleStartAutoBattle} style={primaryButton()}>
                  Start Battle
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAutoMode("Casual");
                    setMessage("");
                  }}
                  style={secondaryButton()}
                >
                  Reset
                </button>
              </div>

              <div style={{ fontSize: 14, opacity: 0.72 }}>
                {message || "Choose an Auto Arena mode and begin."}
              </div>
            </section>
          </>
        ) : (
          <section
            style={{
              ...glassCard(),
              padding: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Arena Clash
              </div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Enter Tactical Mode</div>
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.76, maxWidth: 860 }}>
              In Arena Clash, you manually choose Strike, Guard, Skill, Switch, or Charge.
              Skills cost Focus, switching costs Tempo, and the exchange outcome still comes
              from stat collisions rather than auto-win effects.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={handleStartArenaClash} style={primaryButton()}>
                Enter Arena Clash
              </button>

              <button
                type="button"
                onClick={() => {
                  setHubMode("auto-arena");
                  setMessage("");
                }}
                style={secondaryButton()}
              >
                Back to Auto Arena
              </button>
            </div>

            <div style={{ fontSize: 14, opacity: 0.72 }}>
              {message || "Bring a full 5-card team into Arena Clash."}
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}