"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import {
  glassCard,
  primaryButton,
  rarityColors,
  secondaryButton,
  statColor,
} from "@/components/ui";
import {
  clearPendingPackReveal,
  getPendingPackReveal,
  type PendingPackReveal,
} from "@/lib/packRevealStorage";
import type { FighterCard } from "@/types/game";
import { addWalletCoins } from "@/lib/walletStorage";

type RevealStage = "charging" | "flash" | "revealed";

function getPackLabel(source: PendingPackReveal["source"]) {
  return source === "elite" ? "Elite Banner" : "Standard Pack";
}

function getPackAccent(source: PendingPackReveal["source"]) {
  return source === "elite"
    ? "linear-gradient(180deg, rgba(251,146,60,0.22), rgba(127,29,29,0.34))"
    : "linear-gradient(180deg, rgba(96,165,250,0.18), rgba(30,58,138,0.34))";
}

function StatPill({
  label,
  value,
}: {
  label: keyof FighterCard["stats"];
  value: number;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{label}</div>
      <div
        style={{
          marginTop: 4,
          fontSize: 18,
          fontWeight: 800,
          color: statColor(value),
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function PackOpeningPage() {
  const router = useRouter();

  const [reveal, setReveal] = useState<PendingPackReveal | null>(null);
  const [stage, setStage] = useState<RevealStage>("charging");
  const [coinsApplied, setCoinsApplied] = useState(false);

  useEffect(() => {
    const pending = getPendingPackReveal();

    if (!pending) {
      router.replace("/shop");
      return;
    }

    setReveal(pending);

    const flashTimer = window.setTimeout(() => {
      setStage("flash");
    }, 1550);

    const revealTimer = window.setTimeout(() => {
      setStage("revealed");
    }, 1820);

    return () => {
      window.clearTimeout(flashTimer);
      window.clearTimeout(revealTimer);
    };
  }, [router]);

  useEffect(() => {
    if (!reveal) return;
    if (stage !== "revealed") return;
    if (coinsApplied) return;

    if (reveal.outcome === "duplicate" && reveal.coinCompensation > 0) {
      addWalletCoins(reveal.coinCompensation);
    }

    setCoinsApplied(true);
  }, [coinsApplied, reveal, stage]);

  const tone = useMemo(
    () => (reveal ? rarityColors(reveal.card.rarity) : null),
    [reveal]
  );

  function leaveTo(path: "/shop" | "/collection") {
    clearPendingPackReveal();
    router.push(path);
  }

  if (!reveal || !tone) {
    return null;
  }

  const { card } = reveal;

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            ...glassCard(),
            padding: 18,
            position: "relative",
            overflow: "hidden",
            minHeight: 620,
          }}
        >
          <div
            className={`pack-opening-shell rarity-${card.rarity.toLowerCase().replace(/[^a-z]/g, "")}`}
          >
            <div className="pack-opening-header">
              <div>
                <div className="pack-opening-kicker">Pack Opening</div>
                <div className="pack-opening-title">{getPackLabel(reveal.source)}</div>
              </div>
              <div className="pack-opening-subtle">
                {stage === "revealed" ? "Reveal complete" : "Energy charging..."}
              </div>
            </div>

            <div className="pack-opening-stage">
              <div
                className={[
                  "pack-aura",
                  reveal.source === "elite" ? "pack-aura-elite" : "pack-aura-standard",
                  stage === "revealed" ? "pack-aura-revealed" : "",
                ].join(" ")}
              />

              {stage !== "revealed" && (
                <>
                  <div className="pack-particles">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span
                        key={index}
                        className="pack-particle"
                        style={
                          {
                            ["--delay" as string]: `${index * 0.12}s`,
                            ["--x" as string]: `${(index % 6) * 18 - 44}px`,
                            ["--size" as string]: `${6 + (index % 3) * 4}px`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>

                  <div
                    className={[
                      "pack-case",
                      stage === "charging" ? "pack-case-charging" : "",
                      stage === "flash" ? "pack-case-flash" : "",
                    ].join(" ")}
                    style={{ background: getPackAccent(reveal.source) }}
                  >
                    <div className="pack-case-topline" />
                    <div className="pack-case-symbol">刃</div>
                    <div className="pack-case-name">
                      {reveal.source === "elite" ? "ELITE BANNER" : "STANDARD PACK"}
                    </div>
                    <div className="pack-case-glowline" />
                  </div>

                  <div className={["pack-crack", stage === "flash" ? "pack-crack-live" : ""].join(" ")} />
                  <div className={["pack-flash", stage === "flash" ? "pack-flash-live" : ""].join(" ")} />
                </>
              )}

              {stage === "revealed" && (
                <div
                  className="revealed-card-wrap"
                  style={
                    {
                      borderColor: tone.border,
                      background: tone.bg,
                      ["--reveal-text" as string]: tone.text,
                    } as React.CSSProperties
                  }
                >
                  <div className="revealed-card-top">
                    <div
                      className="revealed-card-universe"
                      style={{ color: tone.text }}
                    >
                      {card.universe}
                    </div>
                    <div className="revealed-card-stars">{card.stars}★</div>
                  </div>

                  <div className="revealed-card-main">
                    <div className="revealed-card-name">{card.name}</div>
                    <div className="revealed-card-title">{card.title}</div>
                  </div>

                  <div className="revealed-card-meta">
                    <span>{card.rarity}</span>
                    <span>•</span>
                    <span>{card.type}</span>
                  </div>

                  <div className="revealed-card-skill">
                    {card.skill}
                  </div>

                  <div className="revealed-card-stats">
                    <StatPill label="STR" value={card.stats.STR} />
                    <StatPill label="SPD" value={card.stats.SPD} />
                    <StatPill label="TECH" value={card.stats.TECH} />
                    <StatPill label="DUR" value={card.stats.DUR} />
                    <StatPill label="DEF" value={card.stats.DEF} />
                    <StatPill label="INSTINCT" value={card.stats.INSTINCT} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {stage === "revealed" && (
          <div
            style={{
              ...glassCard(),
              padding: 18,
              border: `1px solid ${tone.border}`,
              background: tone.bg,
            }}
          >
            <div style={{ fontSize: 12, color: tone.text, fontWeight: 800, letterSpacing: 1 }}>
              {reveal.outcome === "new" ? "NEW FIGHTER" : "DUPLICATE"}
            </div>

            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>
              {reveal.outcome === "new"
                ? `${card.name} joined your collection`
                : `${card.name} converted into ${reveal.coinCompensation} Coins`}
            </div>

            <div
              style={{
                marginTop: 10,
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.5,
              }}
            >
              {reveal.outcome === "new"
                ? "A new fighter has been added to your roster."
                : "You already own this fighter, so the duplicate was converted into coin compensation."}
            </div>

            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <button
                onClick={() => leaveTo("/collection")}
                style={primaryButton()}
              >
                To Collection
              </button>
              <button
                onClick={() => leaveTo("/shop")}
                style={secondaryButton()}
              >
                Back to Shop
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}