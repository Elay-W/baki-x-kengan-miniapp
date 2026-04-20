"use client";

import { useState } from "react";

import { primaryButton, rarityColors, secondaryButton } from "@/components/ui";
import type { FighterCard } from "@/types/game";

type FighterVisualCardProps = {
  card: FighterCard;
  imageSrc?: string;
  label?: string;
  copies?: number;
  stateLabel?: string;
  actionSlot?: React.ReactNode;
  onOpenDetails?: () => void;
  compact?: boolean;
};

function getAccent(card: FighterCard) {
  const rarity = rarityColors(card.rarity);
  return {
    border: rarity.border,
    text: rarity.text,
    bg: rarity.bg,
  };
}

export default function FighterVisualCard({
  card,
  imageSrc,
  label,
  copies,
  stateLabel,
  actionSlot,
  onOpenDetails,
  compact = false,
}: FighterVisualCardProps) {
  const [flipped, setFlipped] = useState(false);
  const accent = getAccent(card);
  const cardHeight = compact ? 420 : 560;

  return (
    <div
      style={{
        perspective: "1400px",
        width: "100%",
      }}
    >
      <div
        onClick={() => setFlipped((prev) => !prev)}
        style={{
          position: "relative",
          width: "100%",
          minHeight: cardHeight,
          transformStyle: "preserve-3d",
          transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          cursor: "pointer",
        }}
      >
        {/* FRONT */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: compact ? 20 : 24,
            overflow: "hidden",
            border: `1px solid ${accent.border}`,
            background: accent.bg,
            boxShadow: `0 0 24px ${accent.border}22`,
          }}
        >
          <div
            style={{
              position: "relative",
              minHeight: cardHeight,
              background: imageSrc
                ? `center / cover no-repeat url("${imageSrc}")`
                : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.14) 35%, rgba(0,0,0,0.84) 100%)",
              }}
            />

            {!imageSrc && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.42)",
                }}
              >
                No Art Yet
              </div>
            )}

            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: compact ? 12 : 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {label && (
                    <div
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.34)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </div>
                  )}

                  {stateLabel && (
                    <div
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.34)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {stateLabel}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {typeof copies === "number" && (
                    <div
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.34)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      x{copies}
                    </div>
                  )}

                  <div
                    style={{
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(0,0,0,0.34)",
                      border: `1px solid ${accent.border}`,
                      color: accent.text,
                      fontSize: 11,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {card.rarity}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  padding: compact ? 12 : 14,
                  borderRadius: compact ? 18 : 20,
                  background: "rgba(0,0,0,0.46)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: compact ? 20 : 28,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {card.name}
                  </div>

                  <div
                    style={{
                      fontSize: compact ? 12 : 14,
                      opacity: 0.76,
                      marginTop: 6,
                    }}
                  >
                    {card.title}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.76 }}>
                    {card.type} • {card.universe} • {card.stars}★
                  </div>

                  <div
                    style={{
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 11,
                      fontWeight: 800,
                      opacity: 0.85,
                    }}
                  >
                    Tap to reveal stats
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: compact ? 20 : 24,
            overflow: "hidden",
            border: `1px solid ${accent.border}`,
            background:
              "linear-gradient(180deg, rgba(10,10,12,0.98), rgba(22,12,8,0.98))",
            boxShadow: `0 0 24px ${accent.border}22`,
            display: "grid",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 20% 15%, ${accent.border}22, transparent 34%)`,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              padding: compact ? 14 : 18,
              display: "grid",
              gap: 14,
              alignContent: "start",
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
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.6,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  Stats Side
                </div>
                <div
                  style={{
                    fontSize: compact ? 20 : 28,
                    fontWeight: 900,
                    lineHeight: 1,
                    marginTop: 6,
                  }}
                >
                  {card.name}
                </div>
                <div
                  style={{
                    fontSize: compact ? 12 : 14,
                    opacity: 0.76,
                    marginTop: 6,
                  }}
                >
                  {card.title}
                </div>
              </div>

              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  border: `1px solid ${accent.border}`,
                  color: accent.text,
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 11,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                }}
              >
                {card.rarity}
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
                ["STR", card.stats.STR],
                ["SPD", card.stats.SPD],
                ["TECH", card.stats.TECH],
                ["DEF", card.stats.DEF],
                ["DUR", card.stats.DUR],
                ["INST", card.stats.INSTINCT],
              ].map(([labelText, value]) => (
                <div
                  key={`${card.id}-${labelText}`}
                  style={{
                    padding: compact ? 10 : 12,
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
                  <div
                    style={{
                      fontSize: compact ? 16 : 18,
                      fontWeight: 900,
                      marginTop: 4,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.76 }}>
                {card.type} • {card.universe} • {card.stars}★
              </div>

              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 11,
                  fontWeight: 800,
                  opacity: 0.85,
                }}
              >
                Tap again to flip back
              </div>
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              {onOpenDetails && (
                <button
                  type="button"
                  onClick={onOpenDetails}
                  style={primaryButton()}
                >
                  Expanded Description
                </button>
              )}

              {actionSlot}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}