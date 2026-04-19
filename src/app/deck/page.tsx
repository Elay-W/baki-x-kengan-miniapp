"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import {
  glassCard,
  primaryButton,
  secondaryButton,
  rarityColors,
} from "@/components/ui";
import type { FighterCard } from "@/types/game";
import {
  clearSavedDeck,
  loadDeck,
  saveDeck,
} from "@/lib/deckStorage";
import {
  getOwnedCardsDetailed,
  seedStarterCollection,
} from "@/lib/collectionStorage";

const DECK_SIZE = 5;

type OwnedCard = ReturnType<typeof getOwnedCardsDetailed>[number];

export default function DeckPage() {
  const [deck, setDeck] = useState<FighterCard[]>([]);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [query, setQuery] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    seedStarterCollection();

    const storedDeck = loadDeck();
    const owned = getOwnedCardsDetailed();

    setDeck(storedDeck.slice(0, DECK_SIZE));
    setOwnedCards(owned);
  }, []);

  const filteredCards = useMemo(() => {
    return ownedCards.filter((card) =>
      query.trim()
        ? card.name.toLowerCase().includes(query.toLowerCase()) ||
          card.title.toLowerCase().includes(query.toLowerCase())
        : true
    );
  }, [ownedCards, query]);

  function addToDeck(card: FighterCard) {
    const exists = deck.some((item) => item.id === card.id);
    if (exists) return;

    if (deck.length >= DECK_SIZE) return;

    setDeck((prev) => [...prev, card]);
    setSavedMessage("");
  }

  function removeFromDeck(cardId: number) {
    setDeck((prev) => prev.filter((card) => card.id !== cardId));
    setSavedMessage("");
  }

  function clearDeck() {
    setDeck([]);
    clearSavedDeck();
    setSavedMessage("Deck cleared.");
  }

  function handleSaveDeck() {
    saveDeck(deck.map((card) => card.id));
    setSavedMessage("Deck saved successfully.");
  }

  const isReady = deck.length === DECK_SIZE;

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 900 }}>Deck Builder</div>
          <div
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.5,
            }}
          >
            Build your main arena deck from fighters you actually own.
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
              <div style={{ fontSize: 18, fontWeight: 800 }}>Current Deck</div>
              <div
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,0.66)",
                }}
              >
                Main Arena Deck
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: `1px solid ${
                  isReady
                    ? "rgba(34,197,94,0.35)"
                    : "rgba(255,255,255,0.12)"
                }`,
                background: isReady
                  ? "rgba(34,197,94,0.18)"
                  : "rgba(255,255,255,0.05)",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {deck.length}/{DECK_SIZE}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {Array.from({ length: DECK_SIZE }).map((_, index) => {
              const card = deck[index];

              if (!card) {
                return (
                  <div
                    key={`empty-${index}`}
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      border: "1px dashed rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.58)",
                    }}
                  >
                    Empty slot #{index + 1}
                  </div>
                );
              }

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
                          lineHeight: 1.4,
                        }}
                      >
                        {card.rarity} • {card.type} • {card.universe}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromDeck(card.id)}
                      style={secondaryButton()}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <button onClick={handleSaveDeck} style={primaryButton()}>
              Save Deck
            </button>
            <button onClick={clearDeck} style={secondaryButton()}>
              Clear
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              color: savedMessage
                ? "#86efac"
                : "rgba(255,255,255,0.68)",
            }}
          >
            {savedMessage ||
              (isReady
                ? "Deck is ready for battle."
                : "Add more fighters to complete the deck.")}
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Owned Fighters</div>
          <div
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,0.66)",
            }}
          >
            Only owned fighters can be added to the deck.
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

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {filteredCards.map((card) => {
              const exists = deck.some((item) => item.id === card.id);
              const full = deck.length >= DECK_SIZE;
              const tone = rarityColors(card.rarity);

              return (
                <button
                  key={card.id}
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "start",
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
                        {card.title}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(0,0,0,0.16)",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {exists ? "In deck" : full ? "Deck full" : "Add"}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      color: "rgba(255,255,255,0.66)",
                      fontSize: 13,
                    }}
                  >
                    {card.rarity} • {card.type} • {card.universe} • x{card.copies}
                  </div>
                </button>
              );
            })}

            {filteredCards.length === 0 && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                No owned fighters match this search.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}