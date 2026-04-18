"use client";

import { useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import CardTile from "@/components/CardTile";
import { cards, rarityOrder } from "@/data/cards";
import type { Rarity, Universe } from "@/types/game";

export default function CollectionPage() {
  const [query, setQuery] = useState("");
  const [universeFilter, setUniverseFilter] = useState<Universe | "All">("All");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "All">("All");

  const filteredCards = useMemo(() => {
    return cards
      .filter((card) =>
        query.trim()
          ? card.name.toLowerCase().includes(query.toLowerCase()) ||
            card.title.toLowerCase().includes(query.toLowerCase())
          : true
      )
      .filter((card) => (universeFilter === "All" ? true : card.universe === universeFilter))
      .filter((card) => (rarityFilter === "All" ? true : card.rarity === rarityFilter))
      .sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
  }, [query, universeFilter, rarityFilter]);

  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>Collection</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          {filteredCards.length} cards shown
        </div>
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
        {filteredCards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </PageShell>
  );
}