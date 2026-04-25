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

function ModeCard({
  eyebrow,
  title,
  description,
  active,
  badge,
  onClick,
}: {
  eyebrow: string;
  title: string;
  description: string;
  active: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...glassCard(),
        padding: 18,
        textAlign: "left",
        display: "grid",
        gap: 12,
        cursor: "pointer",
        border: active
          ? "1px solid rgba(255,255,255,0.16)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active ? "rgba(255,255,255,0.08)" : "rgba(8,8,12,0.74)",
        minHeight: 180,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "start",
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
          {eyebrow}
        </div>

        {badge && (
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          lineHeight: 0.96,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.48,
          opacity: 0.76,
          maxWidth: 360,
        }}
      >
        {description}
      </div>
    </button>
  );
}

function MiniDeckCard({ card }: { card: FighterCard }) {
  const rarity = rarityColors(card.rarity);

  return (
    <div
      style={{
        ...glassCard(),
        padding: 12,
        display: "grid",
        gap: 6,
        border: `1px solid ${rarity.border}`,
        background: rarity.bg,
        minHeight: 96,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "start",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          {card.name}
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: rarity.text,
            whiteSpace: "nowrap",
          }}
        >
          {card.stars}★
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          opacity: 0.72,
          lineHeight: 1.3,
        }}
      >
        {card.title}
      </div>

      <div
        style={{
          fontSize: 11,
          opacity: 0.62,
        }}
      >
        {card.rarity}
      </div>
    </div>
  );
}

export default function BattlePage() {
  const router = useRouter();

  const [hubMode, setHubMode] = useState<BattleHubMode>("auto-arena");
  const [autoMode, setAutoMode] = useState<BattleMode>("Casual");
  const [deck, setDeck] = useState<FighterCard[]>([]);
  const [message, setMessage] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setDeck(loadDeck());
    setIsHydrated(true);
  }, []);

  const enemyTeam = useMemo(() => {
    const ids = enemyPools[autoMode];
    return ids
      .map((id) => cards.find((card) => card.id === id))
      .filter(Boolean) as FighterCard[];
  }, [autoMode]);

  const deckPreview = useMemo(() => deck.slice(0, 3), [deck]);
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

  return (
    <PageShell
      playerName="Underground Fighter"
      yen={24500}
      tokens={180}
    >
      <section
        style={{
          ...glassCard(),
          padding: 18,
          display: "grid",
          gap: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.76)",
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
          Battle Hub
        </div>

        <div
          style={{
            fontSize: 38,
            fontWeight: 900,
            lineHeight: 0.94,
          }}
        >
          Choose Your Arena
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.48,
            opacity: 0.76,
            maxWidth: 360,
          }}
        >
          Pick your combat style, bring your saved fighters, and enter the next match.
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        <ModeCard
          eyebrow="Fast Mode"
          title="Auto Arena"
          description="Quick battle setup with Ranked, Casual, and Training presets. Best for short sessions and fast progression."
          active={hubMode === "auto-arena"}
          badge="Classic"
          onClick={() => {
            setHubMode("auto-arena");
            setMessage("");
          }}
        />

        <ModeCard
          eyebrow="Tactical Mode"
          title="Arena Clash"
          description="Manual actions, Focus, Tempo, switching, and signature skills. A deeper mode built around stat clashes and decisions."
          active={hubMode === "arena-clash"}
          badge="Manual"
          onClick={() => {
            setHubMode("arena-clash");
            setMessage("");
          }}
        />
      </section>

      <section
        style={{
          ...glassCard(),
          padding: 16,
          display: "grid",
          gap: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.76)",
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
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Main Team
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Saved Arena Deck
            </div>
          </div>

          <div
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {isHydrated ? `${deck.length}/5` : "0/5"}
          </div>
        </div>

        {isHydrated && deck.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {deckPreview.map((card) => (
              <MiniDeckCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 18,
              padding: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 14,
              opacity: 0.74,
              lineHeight: 1.45,
            }}
          >
            {isHydrated
              ? "No saved deck yet. Go to Deck and build a 5-card team."
              : "Loading your saved deck from local storage."}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {isHydrated &&
            deck.slice(0, 5).map((card) => (
              <div
                key={`deck-chip-${card.id}`}
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {card.name}
              </div>
            ))}
        </div>
      </section>

      {hubMode === "auto-arena" ? (
        <section
          style={{
            ...glassCard(),
            padding: 16,
            display: "grid",
            gap: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(8,8,12,0.76)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Auto Arena
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Mode Select
            </div>
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
                      ? "1px solid rgba(255,255,255,0.16)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: active ? "#ffffff" : "rgba(255,255,255,0.04)",
                    color: active ? "#000000" : "#ffffff",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div
            style={{
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
                opacity: 0.6,
              }}
            >
              Opponent Preview
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {enemyTeam.slice(0, 3).map((card) => (
                <MiniDeckCard key={`enemy-${card.id}`} card={card} />
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button type="button" onClick={handleStartAutoBattle} style={primaryButton()}>
              Start Auto Arena
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

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              opacity: 0.72,
            }}
          >
            {message || "Select a mode and begin the next automatic match."}
          </div>
        </section>
      ) : (
        <section
          style={{
            ...glassCard(),
            padding: 16,
            display: "grid",
            gap: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(8,8,12,0.76)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Arena Clash
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Enter Tactical Mode
            </div>
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.48,
              opacity: 0.76,
            }}
          >
            In Arena Clash, every exchange matters. Choose actions manually, spend Focus,
            rotate fighters with Tempo, and push toward a decisive stat clash.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <div
              style={{
                borderRadius: 16,
                padding: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6 }}>Action Set</div>
              <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>5 Commands</div>
            </div>

            <div
              style={{
                borderRadius: 16,
                padding: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6 }}>Resources</div>
              <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>Focus + Tempo</div>
            </div>

            <div
              style={{
                borderRadius: 16,
                padding: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6 }}>Team Size</div>
              <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>5 Fighters</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
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
              Switch to Auto
            </button>
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              opacity: 0.72,
            }}
          >
            {message || "Bring a full 5-card team into Arena Clash."}
          </div>
        </section>
      )}
    </PageShell>
  );
}