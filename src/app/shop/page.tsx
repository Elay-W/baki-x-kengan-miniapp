"use client";

import PageShell from "@/components/PageShell";
import { glassCard, primaryButton } from "@/components/ui";

export default function ShopPage() {
  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 32, fontWeight: 700 }}>Shop</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
          Packs, banners and future event drops
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            padding: 20,
            borderRadius: 24,
            border: "1px solid rgba(251,146,60,0.35)",
            background: "rgba(154,52,18,0.18)",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fdba74" }}>
            Featured
          </div>
          <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>Arena Legends Pack</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#d4d4d8", lineHeight: 1.45 }}>
            Higher chance for Legendary and Elite fighters.
          </div>
          <button style={{ ...primaryButton(), marginTop: 18 }}>Open Pack</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ ...glassCard(), padding: 18 }}>
            <div style={{ fontSize: 14, color: "#a1a1aa" }}>Standard Pack</div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>100 Coins</div>
          </div>

          <div style={{ ...glassCard(), padding: 18 }}>
            <div style={{ fontSize: 14, color: "#a1a1aa" }}>Elite Banner</div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>350 Coins</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}