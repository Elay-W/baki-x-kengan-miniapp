"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
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
import { addWalletCoins } from "@/lib/walletStorage";
import type { FighterCard } from "@/types/game";

type RevealStage = "charging" | "burst" | "revealed";

function getPackLabel(source: PendingPackReveal["source"]) {
  return source === "elite" ? "Elite Banner" : "Standard Pack";
}

function isTopTierRarity(rarity: string) {
  return ["Elite", "Legendary"].includes(rarity);
}

function getRevealTimings(reveal: PendingPackReveal) {
  const topTier = isTopTierRarity(reveal.card.rarity);
  const isEliteSource = reveal.source === "elite";

  if (topTier || isEliteSource) {
    return {
      burstDelay: 1850,
      revealDelay: 2450,
    };
  }

  return {
    burstDelay: 1450,
    revealDelay: 1950,
  };
}

function getAuraBackground(reveal: PendingPackReveal) {
  const rarity = reveal.card.rarity;

  if (rarity === "Legendary") {
    return "radial-gradient(circle, rgba(251,146,60,0.34), rgba(120,53,15,0.08) 68%, transparent 72%)";
  }

  if (rarity === "Elite") {
    return "radial-gradient(circle, rgba(250,204,21,0.28), rgba(113,63,18,0.08) 68%, transparent 72%)";
  }

  return reveal.source === "elite"
    ? "radial-gradient(circle, rgba(251,146,60,0.28), rgba(127,29,29,0.06) 70%, transparent 72%)"
    : "radial-gradient(circle, rgba(96,165,250,0.24), rgba(30,58,138,0.06) 70%, transparent 72%)";
}

function getPackGradient(reveal: PendingPackReveal) {
  const rarity = reveal.card.rarity;

  if (rarity === "Legendary") {
    return "linear-gradient(180deg, rgba(180,83,9,0.42), rgba(17,17,17,0.96))";
  }

  if (rarity === "Elite") {
    return "linear-gradient(180deg, rgba(146,64,14,0.34), rgba(17,17,17,0.96))";
  }

  return reveal.source === "elite"
    ? "linear-gradient(180deg, rgba(251,146,60,0.22), rgba(127,29,29,0.34))"
    : "linear-gradient(180deg, rgba(96,165,250,0.18), rgba(30,58,138,0.34))";
}

function getStageText(reveal: PendingPackReveal, stage: RevealStage) {
  if (stage === "revealed") return "Reveal complete";
  if (stage === "burst") return "Breaking the seal...";
  return reveal.source === "elite"
    ? "Charging elite banner energy..."
    : "Charging standard pack...";
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
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
        {label}
      </div>
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

    const { burstDelay, revealDelay } = getRevealTimings(pending);

    const burstTimer = window.setTimeout(() => {
      setStage("burst");
    }, burstDelay);

    const revealTimer = window.setTimeout(() => {
      setStage("revealed");
    }, revealDelay);

    return () => {
      window.clearTimeout(burstTimer);
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

  function handleSkip() {
    if (!reveal) return;
    setStage("revealed");
  }

  function leaveTo(path: "/shop" | "/collection") {
    clearPendingPackReveal();
    router.push(path);
  }

  if (!reveal || !tone) return null;

  const { card } = reveal;
  const premiumReveal = isTopTierRarity(card.rarity);
  const auraBackground = getAuraBackground(reveal);
  const packGradient = getPackGradient(reveal);

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            ...glassCard(),
            padding: 18,
            position: "relative",
            overflow: "hidden",
            minHeight: 700,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 28%), radial-gradient(circle at bottom, rgba(255,120,40,0.05), transparent 24%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "grid", gap: 18, minHeight: 660 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  Pack Opening
                </div>
                <div style={{ marginTop: 6, fontSize: 30, fontWeight: 900 }}>
                  {getPackLabel(reveal.source)}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    color: "rgba(255,255,255,0.68)",
                    fontSize: 14,
                  }}
                >
                  {getStageText(reveal, stage)}
                </div>
              </div>

              {stage !== "revealed" && (
                <button onClick={handleSkip} style={secondaryButton()}>
                  Skip
                </button>
              )}
            </div>

            <div
              style={{
                position: "relative",
                minHeight: 560,
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                borderRadius: 30,
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,0.05), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
              }}
            >
              <AnimatePresence>
                {stage !== "revealed" &&
                  Array.from({ length: premiumReveal ? 24 : 14 }).map(
                    (_, index) => {
                      const size = premiumReveal
                        ? 3 + (index % 4) * 2
                        : 2 + (index % 3) * 2;

                      const left = (index * 37) % 100;
                      const duration = premiumReveal
                        ? 2.2 + (index % 4) * 0.35
                        : 1.8 + (index % 3) * 0.28;

                      const delay = (index % 7) * 0.12;

                      const color =
                        card.rarity === "Legendary"
                          ? "rgba(255,180,80,0.88)"
                          : card.rarity === "Elite"
                            ? "rgba(255,220,100,0.86)"
                            : reveal.source === "elite"
                              ? "rgba(255,150,80,0.86)"
                              : "rgba(120,180,255,0.85)";

                      return (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, y: 40 }}
                          animate={{
                            opacity: [0, 1, 0],
                            y: premiumReveal
                              ? [90, -180 - (index % 5) * 18]
                              : [70, -120 - (index % 4) * 16],
                            x: [0, (index % 2 === 0 ? 1 : -1) * (12 + (index % 5) * 5)],
                            scale: [0.7, 1.15, 0.9],
                          }}
                          transition={{
                            duration,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay,
                          }}
                          style={{
                            position: "absolute",
                            left: `${left}%`,
                            bottom: premiumReveal ? "10%" : "16%",
                            width: size,
                            height: size,
                            borderRadius: 999,
                            background: color,
                            boxShadow: `0 0 12px ${color}`,
                            pointerEvents: "none",
                          }}
                        />
                      );
                    }
                  )}
              </AnimatePresence>

              <motion.div
                initial={{ scale: 0.9, opacity: 0.7 }}
                animate={{
                  scale:
                    stage === "revealed"
                      ? premiumReveal
                        ? 1.45
                        : 1.25
                      : premiumReveal
                        ? [0.94, 1.12, 0.94]
                        : [0.95, 1.05, 0.95],
                  opacity: stage === "revealed" ? 0.95 : [0.55, 0.95, 0.55],
                }}
                transition={{
                  duration: stage === "revealed" ? 0.55 : premiumReveal ? 2.2 : 1.8,
                  repeat: stage === "revealed" ? 0 : Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  width: premiumReveal ? 430 : 360,
                  height: premiumReveal ? 430 : 360,
                  borderRadius: 999,
                  filter: premiumReveal ? "blur(26px)" : "blur(22px)",
                  background: auraBackground,
                }}
              />

              {stage !== "revealed" && (
                <motion.div
                  animate={{
                    scale: stage === "burst" ? [1, premiumReveal ? 2.4 : 2.1] : 1,
                    opacity: stage === "burst" ? [0.55, 0] : 0,
                  }}
                  transition={{ duration: premiumReveal ? 0.7 : 0.5, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    width: premiumReveal ? 460 : 380,
                    height: premiumReveal ? 460 : 380,
                    borderRadius: 999,
                    border:
                      card.rarity === "Legendary"
                        ? "2px solid rgba(255,180,90,0.6)"
                        : card.rarity === "Elite"
                          ? "2px solid rgba(255,220,120,0.5)"
                          : "2px solid rgba(255,255,255,0.28)",
                    pointerEvents: "none",
                  }}
                />
              )}

              <AnimatePresence mode="wait">
                {stage !== "revealed" ? (
                  <motion.div
                    key="pack"
                    initial={{ opacity: 0, scale: 0.88, y: 44 }}
                    animate={{
                      opacity: 1,
                      scale: stage === "burst" ? (premiumReveal ? 1.12 : 1.08) : 1,
                      y: [0, -10, 0],
                      rotate:
                        stage === "charging"
                          ? [0, -1, 1, 0]
                          : premiumReveal
                            ? [0, -7, 7, -5, 0]
                            : [0, -6, 6, -4, 0],
                    }}
                    exit={{
                      opacity: 0,
                      scale: premiumReveal ? 0.72 : 0.78,
                      filter: "blur(4px)",
                    }}
                    transition={{
                      opacity: { duration: 0.24 },
                      scale: { duration: stage === "burst" ? 0.3 : 0.4 },
                      y: {
                        duration: premiumReveal ? 2.3 : 2,
                        repeat: stage === "charging" ? Infinity : 0,
                        ease: "easeInOut",
                      },
                      rotate: {
                        duration: stage === "charging" ? 0.24 : 0.36,
                        repeat: stage === "charging" ? Infinity : 0,
                        ease: "linear",
                      },
                    }}
                    style={{
                      width: "min(78vw, 286px)",
                      height: "min(108vw, 392px)",
                      borderRadius: 30,
                      border: "1px solid rgba(255,255,255,0.16)",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow:
                        stage === "burst"
                          ? premiumReveal
                            ? "0 0 180px rgba(255,255,255,0.42)"
                            : "0 0 120px rgba(255,255,255,0.35)"
                          : "0 24px 80px rgba(0,0,0,0.48)",
                      background: packGradient,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.14), transparent 22%, transparent 72%, rgba(255,255,255,0.08))",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 18,
                        left: 18,
                        right: 18,
                        height: 1,
                        background: "rgba(255,255,255,0.16)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        fontSize: premiumReveal ? 100 : 94,
                        fontWeight: 900,
                        color: "rgba(255,255,255,0.14)",
                        transform: "translateY(-14px)",
                      }}
                    >
                      刃
                    </div>

                    <motion.div
                      animate={{
                        opacity: stage === "charging" ? [0.35, 0.8, 0.35] : 1,
                      }}
                      transition={{
                        duration: premiumReveal ? 1.2 : 1,
                        repeat: stage === "charging" ? Infinity : 0,
                      }}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: 56,
                        bottom: 56,
                        width: premiumReveal ? 2 : 1,
                        transform: "translateX(-50%)",
                        background:
                          "linear-gradient(180deg, transparent, rgba(255,255,255,0.42), transparent)",
                        boxShadow: premiumReveal
                          ? "0 0 22px rgba(255,255,255,0.45)"
                          : "none",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        left: 24,
                        right: 24,
                        bottom: 54,
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        color: "rgba(255,255,255,0.68)",
                        textTransform: "uppercase",
                      }}
                    >
                      {reveal.source === "elite" ? "Arena Legends" : "Arena Core"}
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        left: 24,
                        right: 24,
                        bottom: 28,
                        textAlign: "center",
                        fontSize: 14,
                        fontWeight: 900,
                        letterSpacing: "0.22em",
                        color: "rgba(255,255,255,0.88)",
                      }}
                    >
                      {reveal.source === "elite" ? "ELITE BANNER" : "STANDARD PACK"}
                    </div>

                    {stage === "burst" && (
                      <>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: premiumReveal ? "94%" : "88%",
                            opacity: 1,
                          }}
                          transition={{
                            duration: premiumReveal ? 0.34 : 0.28,
                            ease: "easeOut",
                          }}
                          style={{
                            position: "absolute",
                            top: premiumReveal ? "3%" : "6%",
                            left: "50%",
                            width: premiumReveal ? 8 : 6,
                            transform: "translateX(-50%)",
                            borderRadius: 999,
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.98), rgba(255,255,255,0))",
                            boxShadow: premiumReveal
                              ? "0 0 28px rgba(255,255,255,0.98), 0 0 100px rgba(255,255,255,0.65)"
                              : "0 0 20px rgba(255,255,255,0.95), 0 0 60px rgba(255,255,255,0.55)",
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{
                            duration: premiumReveal ? 0.46 : 0.32,
                            ease: "easeOut",
                          }}
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: premiumReveal
                              ? "radial-gradient(circle at center, rgba(255,255,255,0.98), rgba(255,255,255,0.16) 32%, transparent 62%)"
                              : "radial-gradient(circle at center, rgba(255,255,255,0.96), rgba(255,255,255,0.08) 35%, transparent 62%)",
                          }}
                        />
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="card"
                    initial={{
                      opacity: 0,
                      y: 54,
                      scale: 0.8,
                      rotateX: 18,
                      rotateY: premiumReveal ? 10 : 6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      rotateX: 0,
                      rotateY: 0,
                    }}
                    transition={{
                      duration: premiumReveal ? 0.62 : 0.46,
                      ease: "easeOut",
                    }}
                    style={{
                      width: "min(88vw, 380px)",
                      padding: 18,
                      borderRadius: 30,
                      border: `1px solid ${tone.border}`,
                      background: tone.bg,
                      boxShadow: premiumReveal
                        ? `0 30px 100px rgba(0,0,0,0.52), 0 0 90px ${tone.border}`
                        : `0 26px 90px rgba(0,0,0,0.48), 0 0 50px ${tone.border}`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.14), transparent 24%, transparent 72%, rgba(255,255,255,0.08))",
                        pointerEvents: "none",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: tone.text,
                        }}
                      >
                        {card.universe}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: `1px solid ${tone.border}`,
                            background: "rgba(0,0,0,0.18)",
                            fontSize: 11,
                            fontWeight: 900,
                            color: tone.text,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {reveal.outcome === "new" ? "NEW" : "DUPLICATE"}
                        </div>

                        <div style={{ fontSize: 14, fontWeight: 800 }}>
                          {card.stars}★
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          fontSize: premiumReveal ? 30 : 28,
                          lineHeight: 1,
                          fontWeight: 900,
                        }}
                      >
                        {card.name}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          color: "rgba(255,255,255,0.74)",
                          lineHeight: 1.4,
                        }}
                      >
                        {card.title}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.82)",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <span
                        style={{
                          padding: "7px 12px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {card.rarity}
                      </span>
                      <span
                        style={{
                          padding: "7px 12px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {card.type}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        padding: "12px 14px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.84)",
                        lineHeight: 1.45,
                        fontSize: 14,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {card.skill}
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 10,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <StatPill label="STR" value={card.stats.STR} />
                      <StatPill label="SPD" value={card.stats.SPD} />
                      <StatPill label="TECH" value={card.stats.TECH} />
                      <StatPill label="DUR" value={card.stats.DUR} />
                      <StatPill label="DEF" value={card.stats.DEF} />
                      <StatPill label="INSTINCT" value={card.stats.INSTINCT} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {stage === "revealed" && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            style={{
              ...glassCard(),
              padding: 18,
              border: `1px solid ${tone.border}`,
              background: tone.bg,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: tone.text,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                {reveal.outcome === "new" ? "NEW FIGHTER" : "DUPLICATE CONVERSION"}
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${tone.border}`,
                  background: "rgba(0,0,0,0.18)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {card.rarity} • {card.stars}★
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900 }}>
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
                ? premiumReveal
                  ? "A high-tier fighter has been added to your roster. This pull has premium reveal treatment because of its rarity."
                  : "A new fighter has been added to your roster."
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
              <button onClick={() => leaveTo("/shop")} style={primaryButton()}>
                Open Another
              </button>
              <button onClick={() => leaveTo("/collection")} style={secondaryButton()}>
                To Collection
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}