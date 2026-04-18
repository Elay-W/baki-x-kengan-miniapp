"use client";

import { useRouter } from "next/navigation";
import type { FighterCard } from "@/types/game";
import { rarityColors } from "@/components/ui";

export default function CardTile({ card }: { card: FighterCard }) {
  const router = useRouter();
  const tone = rarityColors(card.rarity);

  return (
    <button
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
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#d4d4d8",
        }}
      >
        {card.universe}
      </div>

      <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>{card.name}</div>
      <div style={{ marginTop: 4, fontSize: 13, color: "#d4d4d8", lineHeight: 1.35 }}>
        {card.title}
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
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
}