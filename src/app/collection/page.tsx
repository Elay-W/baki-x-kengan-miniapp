"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { rarityOrder } from "@/data/cards";
import type { Rarity, Universe } from "@/types/game";
import { useRouter } from "next/navigation";
import {
  getOwnedCardsDetailed,
  seedStarterCollection,
} from "@/lib/collectionStorage";
import { rarityColors } from "@/components/ui";

type OwnedCard = ReturnType<typeof getOwnedCardsDetailed>[number];

export default function CollectionPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [universeFilter, setUniverseFilter] = useState<Universe | "All">("All");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "All">("All");

  useEffect(() => {
    seedStarterCollection();

    function refresh() {
      setOwnedCards(getOwnedCardsDetailed());
    }

    refresh();
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const filteredCards = useMemo(() => {
    return ownedCards
      .filter((card) =>
        query.trim()
          ? card.name.toLowerCase().includes(query.toLowerCase()) ||
            card.title.toLowerCase().includes(query.toLowerCase())
          : true
      )
      .filter((card) =>
        universeFilter === "All" ? true : card.universe === universeFilter
      )
      .filter((card) =>
        rarityFilter === "All" ? true : card.rarity === rarityFilter
      )
      .sort(
        (a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity)
      );
  }, [ownedCards, query, universeFilter, rarityFilter]);

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ fontSize: 42, fontWeight: 900 }}>Collection</div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fighter..."
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            outline: "none",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <select
            value={universeFilter}
            onChange={(e) =>
              setUniverseFilter(e.target.value as Universe | "All")
            }
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
            }}
          >
            <option value="All">All universes</option>
            <option value="Baki">Baki</option>
            <option value="Kengan">Kengan</option>
          </select>

          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as Rarity | "All")}
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
            }}
          >
            <option value="All">All rarities</option>
            {rarityOrder.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.68)",
            fontSize: 14,
          }}
        >
          Owned fighters: {ownedCards.length}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          {filteredCards.map((card) => {
            const tone = rarityColors(card.rarity);

            return (
              <button
                key={card.id}
                onClick={() => router.push(`/card/${card.id}`)}
                style={{
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: 24,
                  border: `1px solid ${tone.border}`,
                  background: tone.bg,
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    {card.universe}
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
                    x{card.copies}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1.15,
                  }}
                >
                  {card.name}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.4,
                  }}
                >
                  {card.title}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  <span>{card.rarity}</span>
                  <span>{card.stars}★</span>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    color: "rgba(255,255,255,0.78)",
                    fontSize: 14,
                  }}
                >
                  {card.type}
                </div>
              </button>
            );
          })}
        </div>

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
            No fighters found for the current filters.
          </div>
        )}
      </div>
    </PageShell>
  );
}