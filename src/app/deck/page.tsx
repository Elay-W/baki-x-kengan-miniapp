"use client";

import { useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { cards } from "@/data/cards";
import { glassCard, primaryButton, secondaryButton, rarityColors } from "@/components/ui";
import type { FighterCard } from "@/types/game";

const DECK_SIZE = 5;

export default function DeckPage() {
  const [deck, setDeck] = useState<FighterCard[]>([
    cards[0],
    cards[2],
    cards[3],
  ]);

  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    return cards.filter((card) =>
      query.trim()
        ? card.name.toLowerCase().includes(query.toLowerCase()) ||
          card.title.toLowerCase().includes(query.toLowerCase())
        : true
    );
  }, [query]);

  function addToDeck(card: FighterCard) {
    const exists = deck.some((item) => item.id === card.id);
    if (exists) return;
    if (deck.length >= DECK_SIZE) return;

    setDeck((prev) => [...prev, card]);
  }

  function removeFromDeck(cardId: number) {
    setDeck((prev) => prev.filter((card) => card.id !== cardId));
  }

  function clearDeck() {
    setDeck([]);
  }

  const isReady = deck.length === DECK_SIZE;

  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>Deck Builder</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Build your main arena deck
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
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Current deck</div>
            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 700 }}>
              Main Arena Deck
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: isReady ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
              color: isReady ? "#86efac" : "#d4d4d8",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {deck.length}/{DECK_SIZE}
          </div>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {Array.from({ length: DECK_SIZE }).map((_, index) => {
            const card = deck[index];

            if (!card) {
              return (
                <div
                  key={`empty-${index}`}
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
                  Empty slot #{index + 1}
                </div>
              );
            }

            const tone = rarityColors(card.rarity);

            return (
              <div
                key={`filled-${card.id}-${index}`}
                style={{
                  minHeight: 74,
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

                <button
                  style={secondaryButton()}
                  onClick={() => removeFromDeck(card.id)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <button style={primaryButton()} disabled={!isReady}>
            Save Deck
          </button>

          <button style={secondaryButton()} onClick={clearDeck}>
            Clear
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 13,
            color: isReady ? "#86efac" : "#a1a1aa",
          }}
        >
          {isReady
            ? "Deck is ready for battle."
            : "Add more fighters to complete the deck."}
        </div>
      </div>

      <div style={{ ...glassCard(), padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Available Cards</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Tap a card to add it to the deck
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fighter..."
          style={{
            width: "100%",
            marginTop: 14,
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            outline: "none",
          }}
        />

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {filteredCards.map((card) => {
            const exists = deck.some((item) => item.id === card.id);
            const full = deck.length >= DECK_SIZE;
            const tone = rarityColors(card.rarity);

            return (
              <button
                key={`available-${card.id}`}
                onClick={() => addToDeck(card)}
                disabled={exists || full}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 18,
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  color: "#fff",
                  cursor: exists || full ? "not-allowed" : "pointer",
                  opacity: exists ? 0.55 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{card.name}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#d4d4d8" }}>
                      {card.title}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: tone.text,
                      whiteSpace: "nowrap",
                      alignSelf: "flex-start",
                    }}
                  >
                    {exists ? "In deck" : full ? "Deck full" : "Add"}
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "#d4d4d8" }}>
                  {card.rarity} • {card.type} • {card.universe}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}