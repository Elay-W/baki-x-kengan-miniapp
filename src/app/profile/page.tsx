"use client";

import PageShell from "@/components/PageShell";
import { glassCard, secondaryButton } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <PageShell>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>Profile</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
            Player identity, progression and stats
          </div>
        </div>

        <button style={secondaryButton()} onClick={() => router.push("/")}>
          Back
        </button>
      </div>

      <div style={{ ...glassCard(), padding: 20 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 22,
              background: "#ffffff",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 22,
            }}
          >
            BX
          </div>

          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Arena Player</div>
            <div style={{ marginTop: 4, fontSize: 14, color: "#a1a1aa" }}>@telegram_user</div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Collection</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>8 / 100</div>
          </div>

          <div style={{ ...glassCard(), padding: 16 }}>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Decks</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>1</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}