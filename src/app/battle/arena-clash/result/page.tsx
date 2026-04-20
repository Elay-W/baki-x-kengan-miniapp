"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton } from "@/components/ui";
import {
  clearArenaClashResult,
  loadArenaClashResult,
  type ArenaClashStoredResult,
} from "@/lib/arenaClashStorage";

function getHeadline(result: ArenaClashStoredResult | null) {
  if (!result) return "No Result Found";
  if (!result.winner) return "Draw";
  return result.winner === "player" ? "Victory" : "Defeat";
}

function getHeadlineColor(result: ArenaClashStoredResult | null) {
  if (!result) return "#e4e4e7";
  if (!result.winner) return "#e4e4e7";
  return result.winner === "player" ? "#22c55e" : "#ef4444";
}

export default function ArenaClashResultPage() {
  const [result, setResult] = useState<ArenaClashStoredResult | null>(null);

  useEffect(() => {
    setResult(loadArenaClashResult());
  }, []);

  return (
    <PageShell>
      <main
        style={{
          padding: "16px 16px 120px",
          display: "grid",
          gap: 16,
        }}
      >
        <section
          style={{
            ...glassCard(),
            padding: 20,
            display: "grid",
            gap: 14,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Arena Clash
          </div>

          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: getHeadlineColor(result),
            }}
          >
            {getHeadline(result)}
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              opacity: 0.76,
              maxWidth: 820,
            }}
          >
            {result
              ? `Match finished after ${result.exchangeNumber} exchanges and ${result.roundNumber} rounds.`
              : "No saved Arena Clash result was found."}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ ...glassCard(), padding: 16, display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Winner</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>
              {result?.winner ? result.winner.toUpperCase() : "DRAW"}
            </div>
          </div>

          <div style={{ ...glassCard(), padding: 16, display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Reason</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>
              {result?.reason ?? "unknown"}
            </div>
          </div>

          <div style={{ ...glassCard(), padding: 16, display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Player Remaining</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>
              {result?.playerRemaining ?? "-"}
            </div>
          </div>

          <div style={{ ...glassCard(), padding: 16, display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Enemy Remaining</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>
              {result?.enemyRemaining ?? "-"}
            </div>
          </div>
        </section>

        <section
          style={{
            ...glassCard(),
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 900 }}>Final Battle Log</div>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            {result?.lastLogLines?.length ? (
              result.lastLogLines.map((line, index) => (
                <div
                  key={`${index}-${line}`}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 12,
                    padding: 10,
                    fontSize: 13,
                    lineHeight: 1.35,
                  }}
                >
                  {line}
                </div>
              ))
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 13,
                  opacity: 0.7,
                }}
              >
                No saved log lines.
              </div>
            )}
          </div>
        </section>

        <section
          style={{
            ...glassCard(),
            padding: 16,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
         <Link href="/battle/arena-clash/versus" style={primaryButton()}>
  Start New Arena Clash
</Link>

          <Link href="/battle" style={secondaryButton()}>
            Back to Battle Hub
          </Link>

          <button
            type="button"
            onClick={() => {
              clearArenaClashResult();
              setResult(null);
            }}
            style={secondaryButton()}
          >
            Clear Result
          </button>
        </section>
      </main>
    </PageShell>
  );
}