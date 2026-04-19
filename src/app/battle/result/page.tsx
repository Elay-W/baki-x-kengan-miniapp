"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import PageShell from "@/components/PageShell";
import {
  glassCard,
  primaryButton,
  rarityColors,
  secondaryButton,
} from "@/components/ui";
import {
  isBattleRewardApplied,
  loadBattleResult,
  loadBattleSetup,
  markBattleRewardApplied,
  saveBattleResult,
} from "@/lib/battleStorage";
import { simulateBattle, type BattleResultData } from "@/lib/battleMock";
import { addWalletCoins, getWalletCoins } from "@/lib/walletStorage";
import type { FighterCard } from "@/types/game";

function TeamMiniCard({ card }: { card: FighterCard }) {
  const tone = rarityColors(card.rarity);

  return (
    <div
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
          fontWeight: 900,
          lineHeight: 1.15,
        }}
      >
        {card.name}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          color: "rgba(255,255,255,0.68)",
          lineHeight: 1.35,
        }}
      >
        {card.rarity} • {card.stars}★
      </div>
    </div>
  );
}

function TeamBlock({
  title,
  deck,
}: {
  title: string;
  deck: FighterCard[];
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        {deck.map((card) => (
          <TeamMiniCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

export default function BattleResultPage() {
  const router = useRouter();

  const [result, setResult] = useState<BattleResultData | null>(null);
  const [walletAfter, setWalletAfter] = useState<number>(0);

  useEffect(() => {
    const storedResult = loadBattleResult();

    if (storedResult) {
      setResult(storedResult);

      if (isBattleRewardApplied()) {
        setWalletAfter(getWalletCoins());
      } else {
        const updatedWallet = addWalletCoins(storedResult.rewardCoins);
        markBattleRewardApplied();
        setWalletAfter(updatedWallet);
      }

      return;
    }

    const setup = loadBattleSetup();
    if (!setup) {
      router.replace("/battle");
      return;
    }

    const simulated = simulateBattle(
      setup.mode,
      setup.playerDeck,
      setup.enemyDeck
    );

    saveBattleResult(simulated);
    setResult(simulated);

    const updatedWallet = addWalletCoins(simulated.rewardCoins);
    markBattleRewardApplied();
    setWalletAfter(updatedWallet);
  }, [router]);

  const accent = useMemo(() => {
    if (!result) return null;

    const win = result.winner === "player";

    if (win) {
      return {
        title: "VICTORY",
        glow: "rgba(34,197,94,0.28)",
        border: "rgba(34,197,94,0.35)",
        bg: "linear-gradient(180deg, rgba(34,197,94,0.18), rgba(0,0,0,0.18))",
        text: "#86efac",
      };
    }

    return {
      title: "DEFEAT",
      glow: "rgba(239,68,68,0.28)",
      border: "rgba(239,68,68,0.35)",
      bg: "linear-gradient(180deg, rgba(239,68,68,0.18), rgba(0,0,0,0.18))",
      text: "#fca5a5",
    };
  }, [result]);

  if (!result || !accent) {
    return (
      <PageShell>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>Loading result...</div>
        </div>
      </PageShell>
    );
  }

  const win = result.winner === "player";
  const rewardText =
    result.rewardCoins > 0
      ? `+${result.rewardCoins} Coins`
      : `${result.rewardCoins} Coins`;

  const rewardSubtext = win
    ? "Arena rewards have been added to your balance."
    : "Battle penalty has been applied to your balance.";

  const mvpTone = result.mvp ? rarityColors(result.mvp.rarity) : null;

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          style={{
            ...glassCard(),
            padding: 18,
            position: "relative",
            overflow: "hidden",
            border: `1px solid ${accent.border}`,
            background: accent.bg,
            boxShadow: `0 0 80px ${accent.glow}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: win
                ? "radial-gradient(circle at center, rgba(34,197,94,0.10), transparent 34%)"
                : "radial-gradient(circle at center, rgba(239,68,68,0.10), transparent 34%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: accent.text,
              }}
            >
              Battle Result
            </div>

            <div
              style={{
                fontSize: 40,
                lineHeight: 1,
                fontWeight: 1000,
                letterSpacing: "0.06em",
                textShadow: `0 0 24px ${accent.glow}`,
              }}
            >
              {accent.title}
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.5,
                fontSize: 15,
              }}
            >
              {win
                ? "Your team dominated the arena and secured the match."
                : "The enemy lineup overpowered your team this time."}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div
                style={{
                  ...glassCard(),
                  padding: 14,
                  border: `1px solid ${accent.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Result
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 24,
                    fontWeight: 900,
                    color: accent.text,
                  }}
                >
                  {rewardText}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.4,
                    fontSize: 13,
                  }}
                >
                  {rewardSubtext}
                </div>
              </div>

              <div
                style={{
                  ...glassCard(),
                  padding: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Wallet
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 24,
                    fontWeight: 900,
                  }}
                >
                  {walletAfter} Coins
                </div>
                <div
                  style={{
                    marginTop: 6,
                    color: "rgba(255,255,255,0.72)",
                    lineHeight: 1.4,
                    fontSize: 13,
                  }}
                >
                  Updated balance after this battle.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          style={{ ...glassCard(), padding: 16 }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Match Summary
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div
              style={{
                ...glassCard(),
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800 }}>Mode</div>
              <div
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                {result.mode}
              </div>
            </div>

            <div
              style={{
                ...glassCard(),
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800 }}>Winner</div>
              <div
                style={{
                  marginTop: 8,
                  color: accent.text,
                  fontWeight: 800,
                }}
              >
                {win ? "Player" : "Enemy"}
              </div>
            </div>

            <div
              style={{
                ...glassCard(),
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800 }}>Your Score</div>
              <div
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                {result.playerScore}
              </div>
            </div>

            <div
              style={{
                ...glassCard(),
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800 }}>Enemy Score</div>
              <div
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                {result.enemyScore}
              </div>
            </div>
          </div>
        </motion.div>

        {result.mvp && mvpTone && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            style={{
              ...glassCard(),
              padding: 16,
              border: `1px solid ${mvpTone.border}`,
              background: mvpTone.bg,
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: mvpTone.text,
                fontWeight: 800,
              }}
            >
              MVP
            </div>

            <div style={{ marginTop: 10, fontSize: 24, fontWeight: 900 }}>
              {result.mvp.name}
            </div>

            <div
              style={{
                marginTop: 8,
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.45,
              }}
            >
              {result.mvp.rarity} • {result.mvp.type} • {result.mvp.universe}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          style={{ display: "grid", gap: 16 }}
        >
          <TeamBlock title="Your Team" deck={result.playerDeck} />
          <TeamBlock title="Enemy Team" deck={result.enemyDeck} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          style={{ ...glassCard(), padding: 16 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <button
              onClick={() => router.push("/battle")}
              style={primaryButton()}
            >
              Battle Again
            </button>

            <button
              onClick={() => router.push("/")}
              style={secondaryButton()}
            >
              Back Home
            </button>
          </div>

          <button
            onClick={() => router.push("/deck")}
            style={{
              ...secondaryButton(),
              width: "100%",
              marginTop: 10,
            }}
          >
            Edit Deck
          </button>
        </motion.div>
      </div>
    </PageShell>
  );
}