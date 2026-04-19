"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { rarityOrder } from "@/data/cards";
import type { Rarity, Universe } from "@/types/game";
import { useRouter } from "next/navigation";
import { getOwnedCardsDetailed, seedStarterCollection } from "@/lib/collectionStorage";
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
    setOwnedCards(getOwnedCardsDetailed());
  }, []);

  const filteredCards = useMemo(() => {
    return ownedCards
      .filter((card) =>
        query.trim()
          ? card.name.toLowerCase().includes(query.toLowerCase()) ||
            card.title.toLowerCase().includes(query.toLowerCase())
          : true
      )
      .filter((card) => (universeFilter === "All" ? true : card.universe === universeFilter))
      .filter((card) => (rarityFilter === "All" ? true : card.rarity === rarityFilter))
      .sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
  }, [ownedCards, query, universeFilter, rarityFilter]);

  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>Collection</div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <select
            value={universeFilter}
            onChange={(e) => setUniverseFilter(e.target.value as Universe | "All")}
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
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filteredCards.map((card) => {
          const tone = rarityColors(card.rarity);

          return (
            <button
              key={`owned-${card.id}`}
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
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#d4d4d8",
                  }}
                >
                  {card.universe}
                </div>

                <div
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.18)",
                    fontSize: 11,
                    color: "#fff",
                  }}
                >
                  x{card.copies}
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>{card.name}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: "#d4d4d8", lineHeight: 1.35 }}>
                {card.title}
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.18)",
                    color: tone.text,
                  }}
                >
                  {card.rarity}
                </span>
                <span>{card.stars}★</span>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: "#d4d4d8" }}>{card.type}</div>
            </button>
          );
        })}
      </div>
    </PageShell>
  );
}