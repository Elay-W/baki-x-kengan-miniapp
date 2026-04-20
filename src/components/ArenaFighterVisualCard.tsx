"use client";

import { rarityColors } from "@/components/ui";
import type { ArenaClashBattleCardRuntime } from "@/lib/arenaClashTypes";

function getStateColor(state: ArenaClashBattleCardRuntime["state"]) {
  switch (state) {
    case "Ready":
      return "#e4e4e7";
    case "Pressured":
      return "#facc15";
    case "Broken":
      return "#fb923c";
    case "KO":
      return "#ef4444";
    default:
      return "#a1a1aa";
  }
}

type Props = {
  fighter: ArenaClashBattleCardRuntime;
  label: string;
  imageSrc?: string;
};

export default function ArenaFighterVisualCard({
  fighter,
  label,
  imageSrc,
}: Props) {
  const rarity = rarityColors(fighter.rarity);
  const stateColor = getStateColor(fighter.state);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        border: `1px solid ${rarity.border}`,
        background: rarity.bg,
        boxShadow: `0 0 24px ${rarity.border}22`,
        display: "grid",
        minHeight: 560,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.78) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 20% 15%, ${rarity.border}22, transparent 34%)`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          minHeight: 560,
          background: imageSrc
            ? `center / cover no-repeat url("${imageSrc}")`
            : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        }}
      >
        {!imageSrc && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "rgba(255,255,255,0.45)",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              zIndex: 1,
            }}
          >
            No Art Yet
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.34)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.34)",
              border: `1px solid ${stateColor}`,
              color: stateColor,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {fighter.state}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 6,
              padding: 14,
              borderRadius: 20,
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
                  {fighter.card.name}
                </div>
                <div style={{ fontSize: 14, opacity: 0.76, marginTop: 6 }}>
                  {fighter.card.title}
                </div>
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${rarity.border}`,
                  color: rarity.text,
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 11,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                {fighter.rarity}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {[
                ["STR", fighter.card.stats.STR],
                ["SPD", fighter.card.stats.SPD],
                ["TECH", fighter.card.stats.TECH],
                ["DEF", fighter.card.stats.DEF],
                ["DUR", fighter.card.stats.DUR],
                ["INST", fighter.card.stats.INSTINCT],
              ].map(([labelText, value]) => (
                <div
                  key={`${fighter.card.id}-${labelText}`}
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.6,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {labelText}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase" }}>
                  Focus
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>
                  {fighter.focus}
                </div>
              </div>

              <div
                style={{
                  padding: 10,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase" }}>
                  Type
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>
                  {fighter.card.type}
                </div>
              </div>

              <div
                style={{
                  padding: 10,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase" }}>
                  Stars
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>
                  {fighter.card.stars}★
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}