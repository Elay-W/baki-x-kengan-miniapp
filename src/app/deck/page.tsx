"use client";

import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton } from "@/components/ui";

export default function DeckPage() {
  const activeDeck = [
    "Yujiro Hanma",
    "Baki Hanma",
    "Tokita Ohma",
    "Kuroki Gensai",
    "Wakatsuki Takeshi",
  ];

  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>Decks</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Your saved loadouts for different battle styles
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>Main Arena Deck</div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#a1a1aa" }}>
                Wildcard / Control / Heavy finishers
              </div>
            </div>

            <span
              style={{
                alignSelf: "flex-start",
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 12,
              }}
            >
              Active
            </span>
          </div>

          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {activeDeck.map((name) => (
              <span
                key={name}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 12,
                  color: "#d4d4d8",
                }}
              >
                {name}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button style={primaryButton()}>Edit Deck</button>
            <button style={secondaryButton()}>Duplicate</button>
          </div>
        </div>

        <div
          style={{
            ...glassCard(),
            padding: 20,
            borderStyle: "dashed",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>+ Create New Deck</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#71717a" }}>
            Next step: we’ll turn this into a full deck builder.
          </div>
        </div>
      </div>
    </PageShell>
  );
}