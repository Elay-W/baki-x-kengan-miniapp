"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, rarityColors } from "@/components/ui";
import {
  loadBattleSetup,
  saveBattleResult,
  loadBattleResult,
} from "@/lib/battleStorage";
import { simulateBattle, type BattleResultData } from "@/lib/battleMock";
import type { FighterCard } from "@/types/game";

function totalStars(deck: FighterCard[]) {
  return deck.reduce((sum, card) => sum + card.stars, 0);
}

function averageStat(
  deck: FighterCard[],
  stat: keyof FighterCard["stats"]
): number {
  if (!deck.length) return 0;
  const total = deck.reduce((sum, card) => sum + card.stats[stat], 0);
  return Math.round(total / deck.length);
}

function MainFighterCard({
  card,
  side,
}: {
  card: FighterCard;
  side: "player" | "enemy";
}) {
  const tone = rarityColors(card.rarity);

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: side === "player" ? -28 : 28,
        scale: 0.94,
      }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
      }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      style={{
        padding: 16,
        borderRadius: 24,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        boxShadow: `0 16px 50px rgba(0,0,0,0.32), 0 0 26px ${tone.border}`,
        minHeight: 182,
        display: "grid",
        alignContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: tone.text,
          }}
        >
          {card.universe}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 950,
          }}
        >
          {card.name}
        </div>

        <div
          style={{
            marginTop: 8,
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.4,
            fontSize: 14,
          }}
        >
          {card.title}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 14,
        }}
      >
        <span
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {card.rarity}
        </span>
        <span
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {card.type}
        </span>
        <span
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {card.stars}★
        </span>
      </div>
    </motion.div>
  );
}

function SupportSlot({
  card,
  index,
  side,
}: {
  card: FighterCard;
  index: number;
  side: "player" | "enemy";
}) {
  const tone = rarityColors(card.rarity);

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: side === "player" ? -18 : 18,
        y: 8,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      transition={{
        duration: 0.26,
        delay: 0.14 + index * 0.06,
        ease: "easeOut",
      }}
      style={{
        padding: 12,
        borderRadius: 16,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
      }}
    >
      <div
        style={{
          fontSize: 10,
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
          marginTop: 8,
          fontSize: 15,
          lineHeight: 1.2,
          fontWeight: 900,
        }}
      >
        {card.name}
      </div>

      <div
        style={{
          marginTop: 6,
          color: "rgba(255,255,255,0.68)",
          fontSize: 12,
          lineHeight: 1.35,
        }}
      >
        {card.rarity} • {card.stars}★
      </div>
    </motion.div>
  );
}

export default function BattleVersusPage() {
  const router = useRouter();

  const [result, setResult] = useState<BattleResultData | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const setup = loadBattleSetup();

    if (!setup) {
      router.replace("/battle");
      return;
    }

    const existing = loadBattleResult();
    const simulated =
      existing ?? simulateBattle(setup.mode, setup.playerDeck, setup.enemyDeck);

    if (!existing) {
      saveBattleResult(simulated);
    }

    setResult(simulated);
  }, [router]);

  useEffect(() => {
    if (!result) return;

    if (countdown <= 0) {
      router.push("/battle/result");
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [countdown, result, router]);

  const playerStats = useMemo(() => {
    if (!result) return null;

    return {
      stars: totalStars(result.playerDeck),
      avgSTR: averageStat(result.playerDeck, "STR"),
      avgTECH: averageStat(result.playerDeck, "TECH"),
      avgINSTINCT: averageStat(result.playerDeck, "INSTINCT"),
    };
  }, [result]);

  const enemyStats = useMemo(() => {
    if (!result) return null;

    return {
      stars: totalStars(result.enemyDeck),
      avgSTR: averageStat(result.enemyDeck, "STR"),
      avgTECH: averageStat(result.enemyDeck, "TECH"),
      avgINSTINCT: averageStat(result.enemyDeck, "INSTINCT"),
    };
  }, [result]);

  if (!result || !playerStats || !enemyStats) {
    return (
      <PageShell>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>Preparing battle...</div>
        </div>
      </PageShell>
    );
  }

  const playerLead = result.playerDeck[0];
  const enemyLead = result.enemyDeck[0];
  const playerSupports = result.playerDeck.slice(1);
  const enemySupports = result.enemyDeck.slice(1);

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            ...glassCard(),
            padding: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 18%, rgba(59,130,246,0.12), transparent 24%), radial-gradient(circle at 80% 18%, rgba(239,68,68,0.12), transparent 24%), radial-gradient(circle at center, rgba(255,255,255,0.04), transparent 34%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gap: 16,
            }}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  Versus Screen
                </div>

                <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900 }}>
                  {result.mode} Battle
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.45,
                  }}
                >
                  Main fighters step into the arena first.
                </div>
              </div>

              <button
                onClick={() => router.push("/battle/result")}
                style={{ ...primaryButton(), width: "100%" }}
              >
                Skip Intro
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Main Clash
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <MainFighterCard card={playerLead} side="player" />

                <div
                  style={{
                    ...glassCard(),
                    padding: 18,
                    display: "grid",
                    justifyItems: "center",
                    gap: 12,
                    background:
                      "radial-gradient(circle at center, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 60%, transparent 70%)",
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.84, opacity: 0 }}
                    animate={{ scale: [0.94, 1.05, 1], opacity: 1 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.14)",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 0 70px rgba(255,255,255,0.10)",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={countdown}
                        initial={{ opacity: 0, scale: 0.6, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.35, y: -8 }}
                        transition={{ duration: 0.26, ease: "easeOut" }}
                        style={{
                          fontSize: countdown > 0 ? 52 : 22,
                          fontWeight: 900,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {countdown > 0 ? countdown : "FIGHT"}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: [0.95, 1.05, 1] }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    style={{
                      fontSize: 38,
                      fontWeight: 1000,
                      letterSpacing: "0.08em",
                      textShadow: "0 0 24px rgba(255,255,255,0.18)",
                    }}
                  >
                    VS
                  </motion.div>
                </div>

                <MainFighterCard card={enemyLead} side="enemy" />
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Support Lineup
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.82)",
                    }}
                  >
                    Your Team
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {playerSupports.map((card, index) => (
                      <SupportSlot
                        key={`player-${card.id}-${index}`}
                        card={card}
                        index={index}
                        side="player"
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.82)",
                    }}
                  >
                    Enemy Team
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {enemySupports.map((card, index) => (
                      <SupportSlot
                        key={`enemy-${card.id}-${index}`}
                        card={card}
                        index={index}
                        side="enemy"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div style={{ ...glassCard(), padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Player Snapshot</div>
                <div
                  style={{
                    marginTop: 8,
                    display: "grid",
                    gap: 6,
                    color: "rgba(255,255,255,0.78)",
                    fontSize: 13,
                  }}
                >
                  <div>Stars: {playerStats.stars}</div>
                  <div>STR: {playerStats.avgSTR}</div>
                  <div>TECH: {playerStats.avgTECH}</div>
                  <div>INSTINCT: {playerStats.avgINSTINCT}</div>
                </div>
              </div>

              <div style={{ ...glassCard(), padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Enemy Snapshot</div>
                <div
                  style={{
                    marginTop: 8,
                    display: "grid",
                    gap: 6,
                    color: "rgba(255,255,255,0.78)",
                    fontSize: 13,
                  }}
                >
                  <div>Stars: {enemyStats.stars}</div>
                  <div>STR: {enemyStats.avgSTR}</div>
                  <div>TECH: {enemyStats.avgTECH}</div>
                  <div>INSTINCT: {enemyStats.avgINSTINCT}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}