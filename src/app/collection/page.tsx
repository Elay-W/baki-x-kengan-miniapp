"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import FighterVisualCard from "@/components/FighterVisualCard";
import PageShell from "@/components/PageShell";
import { glassCard } from "@/components/ui";
import {
  getOwnedCardsDetailed,
  type CollectionCard,
} from "@/lib/collectionStorage";

const universeOptions = ["All", "Baki", "Kengan"] as const;
const rarityOptions = [
  "All",
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Elite",
  "Legendary",
  "God-like",
  "Divine",
] as const;

type UniverseFilter = (typeof universeOptions)[number];
type RarityFilter = (typeof rarityOptions)[number];

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

export default function CollectionPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [universe, setUniverse] = useState<UniverseFilter>("All");
  const [rarity, setRarity] = useState<RarityFilter>("All");
  const [ownedCards, setOwnedCards] = useState<CollectionCard[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setOwnedCards(getOwnedCardsDetailed());
    setIsHydrated(true);
  }, []);

  const filteredCards = useMemo(() => {
    return ownedCards.filter((card) => {
      const matchesSearch =
        !search.trim() ||
        card.name.toLowerCase().includes(search.toLowerCase()) ||
        card.title.toLowerCase().includes(search.toLowerCase());

      const matchesUniverse = universe === "All" || card.universe === universe;
      const matchesRarity = rarity === "All" || card.rarity === rarity;

      return matchesSearch && matchesUniverse && matchesRarity;
    });
  }, [ownedCards, search, universe, rarity]);

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
              Collection
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Owned Fighters
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
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.58,
            }}
          >
            Universe
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {universeOptions.map((item) => (
              <FilterChip
                key={item}
                label={item}
                active={universe === item}
                onClick={() => setUniverse(item)}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.58,
            }}
          >
            Rarity
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {rarityOptions.map((item) => (
              <FilterChip
                key={item}
                label={item}
                active={rarity === item}
                onClick={() => setRarity(item)}
              />
            ))}
          </div>
        </div>
      </section>

      {isHydrated && filteredCards.length > 0 ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {filteredCards.map((card) => (
            <FighterVisualCard
              key={card.id}
              card={card}
              copies={card.copies}
              label={card.universe}
              compact
              imageSrc={`/fighters/${card.id}.png`}
              onOpenDetails={() => router.push(`/card/${card.id}`)}
            />
          ))}
        </section>
      ) : (
        <section
          style={{
            ...glassCard(),
            padding: 18,
            display: "grid",
            gap: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(8,8,12,0.76)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {isHydrated ? "No fighters found" : "Loading collection..."}
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              opacity: 0.72,
            }}
          >
            {isHydrated
              ? "Change filters or search for another fighter."
              : "Syncing your saved collection from local storage."}
          </div>
        </section>
      )}
    </PageShell>
  );
}