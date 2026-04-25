"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import FighterVisualCard from "@/components/FighterVisualCard";
import PageShell from "@/components/PageShell";
import { glassCard, secondaryButton } from "@/components/ui";
import {
  getOwnedCardsDetailed,
  type CollectionCard,
} from "@/lib/collectionStorage";
import { loadDeck, saveDeck } from "@/lib/deckStorage";
import type { FighterCard } from "@/types/game";

const DECK_SIZE = 5;

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 12px",
        borderRadius: 999,
        border: active
          ? "1px solid rgba(255,255,255,0.16)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active ? "#ffffff" : "rgba(255,255,255,0.04)",
        color: active ? "#000000" : "#ffffff",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function DeckPage() {
  const router = useRouter();

  const [deck, setDeck] = useState<FighterCard[]>([]);
  const [ownedCards, setOwnedCards] = useState<CollectionCard[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "In deck" | "Available">("All");
  const [hoveredCardKey, setHoveredCardKey] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setDeck(loadDeck());
    setOwnedCards(getOwnedCardsDetailed());
    setIsHydrated(true);
  }, []);

  const filteredCards = useMemo(() => {
    return ownedCards.filter((card) => {
      const matchesSearch =
        !search.trim() ||
        card.name.toLowerCase().includes(search.toLowerCase()) ||
        card.title.toLowerCase().includes(search.toLowerCase());

      const exists = deck.some((item) => item.id === card.id);

      const matchesFilter =
        filter === "All" ||
        (filter === "In deck" && exists) ||
        (filter === "Available" && !exists);

      return matchesSearch && matchesFilter;
    });
  }, [ownedCards, deck, search, filter]);

  function addToDeck(card: FighterCard) {
    if (deck.some((item) => item.id === card.id)) return;
    if (deck.length >= DECK_SIZE) return;

    const next = [...deck, card];
    setDeck(next);
    saveDeck(next.map((item) => item.id));
  }

  function removeFromDeck(cardId: number) {
    const next = deck.filter((item) => item.id !== cardId);
    setDeck(next);
    saveDeck(next.map((item) => item.id));
  }

  function clearDeck() {
    setDeck([]);
    saveDeck([]);
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
          padding: 16,
          display: "grid",
          gap: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.76)",
          position: "sticky",
          top: "calc(max(8px, env(safe-area-inset-top)) + 86px)",
          zIndex: 15,
          backdropFilter: "blur(14px)",
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
              Deck Builder
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Main Arena Team
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
            {isHydrated ? `${deck.length}/${DECK_SIZE}` : `0/${DECK_SIZE}`}
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fighter name or title"
          style={{
            width: "100%",
            minHeight: 44,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            padding: "0 14px",
            fontSize: 14,
            outline: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {(["All", "In deck", "Available"] as const).map((item) => (
            <FilterChip
              key={item}
              label={item}
              active={filter === item}
              onClick={() => setFilter(item)}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button type="button" onClick={clearDeck} style={secondaryButton()}>
            Clear Deck
          </button>

          <button
            type="button"
            onClick={() => router.push("/battle")}
            style={secondaryButton()}
          >
            Go to Battle
          </button>
        </div>
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
            Current Deck
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Selected Fighters
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {Array.from({ length: DECK_SIZE }).map((_, index) => {
            const card = deck[index];

            if (!card) {
              return (
                <div
                  key={`empty-${index}`}
                  style={{
                    ...glassCard(),
                    minHeight: 210,
                    borderRadius: 22,
                    border: "1px dashed rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.03)",
                    display: "grid",
                    placeItems: "center",
                    padding: 16,
                    textAlign: "center",
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        opacity: 0.55,
                      }}
                    >
                      Slot {index + 1}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        opacity: 0.68,
                        lineHeight: 1.4,
                      }}
                    >
                      Empty fighter slot
                    </div>
                  </div>
                </div>
              );
            }

            const hoverKey = `deck-${card.id}`;
            const isHovered = hoveredCardKey === hoverKey;

            return (
              <div
                key={`deck-card-${card.id}-${index}`}
                onMouseEnter={() => setHoveredCardKey(hoverKey)}
                onMouseLeave={() => setHoveredCardKey(null)}
                style={{
                  position: "relative",
                }}
              >
                <FighterVisualCard
                  card={card}
                  label={`Slot ${index + 1}`}
                  compact
                  imageSrc={`/fighters/${card.id}.png`}
                  onOpenDetails={() => router.push(`/card/${card.id}`)}
                  actionSlot={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromDeck(card.id);
                      }}
                      style={secondaryButton()}
                    >
                      Remove
                    </button>
                  }
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromDeck(card.id);
                  }}
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 16,
                    height: 42,
                    border: "none",
                    borderRadius: 999,
                    cursor: "pointer",
                    background: "linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%)",
                    color: "#111111",
                    fontSize: 13,
                    fontWeight: 900,
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? "translateY(0)" : "translateY(10px)",
                    transition: "all .22s ease",
                    pointerEvents: isHovered ? "auto" : "none",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                  }}
                >
                  Удалить из колоды
                </button>
              </div>
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
              Owned Fighters
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Available Pool
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
            {isHydrated ? `${filteredCards.length}/${ownedCards.length}` : "0/0"}
          </div>
        </div>

        {isHydrated && filteredCards.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {filteredCards.map((card) => {
              const exists = deck.some((item) => item.id === card.id);
              const full = deck.length >= DECK_SIZE;
              const canAdd = !exists && !full;
              const hoverKey = `pool-${card.id}`;
              const isHovered = hoveredCardKey === hoverKey;

              return (
                <div
                  key={`pool-card-${card.id}`}
                  onMouseEnter={() => setHoveredCardKey(hoverKey)}
                  onMouseLeave={() => setHoveredCardKey(null)}
                  style={{
                    position: "relative",
                  }}
                >
                  <FighterVisualCard
                    card={card}
                    copies={card.copies}
                    compact
                    imageSrc={`/fighters/${card.id}.png`}
                    onOpenDetails={() => router.push(`/card/${card.id}`)}
                    actionSlot={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (exists || full) return;
                          addToDeck(card);
                        }}
                        disabled={!canAdd}
                        style={secondaryButton()}
                      >
                        {exists ? "In deck" : full ? "Deck full" : "Добавить в колоду"}
                      </button>
                    }
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!canAdd) return;
                      addToDeck(card);
                    }}
                    disabled={!canAdd}
                    style={{
                      position: "absolute",
                      left: 16,
                      right: 16,
                      bottom: 16,
                      height: 42,
                      border: "none",
                      borderRadius: 999,
                      cursor: canAdd ? "pointer" : "not-allowed",
                      background: canAdd
                        ? "linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%)"
                        : "rgba(255,255,255,0.18)",
                      color: canAdd ? "#111111" : "rgba(255,255,255,0.7)",
                      fontSize: 13,
                      fontWeight: 900,
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? "translateY(0)" : "translateY(10px)",
                      transition: "all .22s ease",
                      pointerEvents: isHovered ? "auto" : "none",
                      boxShadow: canAdd ? "0 10px 24px rgba(0,0,0,0.28)" : "none",
                    }}
                  >
                    {exists ? "In deck" : full ? "Deck full" : "Добавить в колоду"}
                  </button>
                </div>
              );
            })}
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
              ? "No fighters found for the current search or filter."
              : "Loading fighters from local storage."}
          </div>
        )}
      </section>
    </PageShell>
  );
}