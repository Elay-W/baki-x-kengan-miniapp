"use client";

import PageShell from "@/components/PageShell";
import { glassCard } from "@/components/ui";

export default function BattlePage() {
  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>Battle Hub</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Choose your mode and step into the arena
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {[
          ["Ranked", "Climb, test your best deck, earn status"],
          ["Casual", "Fast fights without pressure"],
          ["Training", "Test cards, timing and matchups"],
        ].map(([title, subtitle]) => (
          <button
            key={title}
            style={{
              ...glassCard(),
              padding: 20,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa", lineHeight: 1.45 }}>
              {subtitle}
            </div>
          </button>
        ))}

        <div style={{ ...glassCard(), padding: 20, borderStyle: "dashed" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Events</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#71717a" }}>Coming soon</div>
        </div>
      </div>
    </PageShell>
  );
}