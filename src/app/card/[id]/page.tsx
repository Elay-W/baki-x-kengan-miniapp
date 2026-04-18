"use client";

import { useParams, useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { cards } from "@/data/cards";
import { primaryButton, rarityColors, secondaryButton } from "@/components/ui";
import StatBar from "@/components/StatBar";

export default function CardDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const card = cards.find((item) => item.id === Number(params.id));

  if (!card) {
    return (
      <PageShell>
        <div style={{ fontSize: 28, fontWeight: 700 }}>Card not found</div>
      </PageShell>
    );
  }

  const tone = rarityColors(card.rarity);

  return (
    <PageShell>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{card.name}</div>
          <div style={{ marginTop: 8, fontSize: 16, color: "#a1a1aa" }}>{card.title}</div>
        </div>

        <button style={secondaryButton()} onClick={() => router.push("/collection")}>
          Back
        </button>
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 28,
          border: `1px solid ${tone.border}`,
          background: tone.bg,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#d4d4d8" }}>
              {card.universe}
            </div>
            <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>
              {card.rarity} • {card.stars}★
            </div>
          </div>

          <div
            style={{
              alignSelf: "flex-start",
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.18)",
              fontSize: 13,
            }}
          >
            {card.type}
          </div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <StatBar label="STR" value={card.stats.STR} />
          <StatBar label="SPD" value={card.stats.SPD} />
          <StatBar label="TECH" value={card.stats.TECH} />
          <StatBar label="DUR" value={card.stats.DUR} />
          <StatBar label="DEF" value={card.stats.DEF} />
          <StatBar label="INSTINCT" value={card.stats.INSTINCT} />
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.20)",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a1a1aa" }}>
            Special Skill
          </div>
          <div style={{ marginTop: 10, fontSize: 14, color: "#e4e4e7", lineHeight: 1.5 }}>
            {card.skill}
          </div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button style={primaryButton()}>Add to Deck</button>
          <button style={secondaryButton()}>Favourite</button>
        </div>
      </div>
    </PageShell>
  );
}