"use client";
import FighterVisualCard from "@/components/FighterVisualCard";
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
  <FighterVisualCard
    key={card.id}
    card={card}
    copies={card.copies}
    label={card.universe}
    compact
    imageSrc={`/fighters/${card.id}.png`}
    onOpenDetails={() => router.push(`/card/${card.id}`)}
  />
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