"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, rarityColors, secondaryButton } from "@/components/ui";
import {
  loadBattleSetup,
  loadBattleResult,
  saveBattleResult,
  isBattleRewardApplied,
  markBattleRewardApplied,
} from "@/lib/battleStorage";
import { simulateBattle, type BattleResultData } from "@/lib/battleMock";
import type { BattleTimelineEvent, CardState } from "@/lib/battleTypes";
import { addWalletCoins, getWalletCoins } from "@/lib/walletStorage";
import { getBattleHeadline, getBattleSummaryText } from "@/lib/battleEngine";
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
          <TeamMiniCard key={`${title}-${card.id}`} card={card} />
        ))}
      </div>
    </div>
  );
}

function stateBadgeStyle(state: CardState) {
  if (state === "Ready") {
    return {
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.05)",
      color: "rgba(255,255,255,0.82)",
    };
  }

  if (state === "Pressured") {
    return {
      border: "1px solid rgba(250,204,21,0.28)",
      background: "rgba(250,204,21,0.12)",
      color: "#fde68a",
    };
  }

  if (state === "Broken") {
    return {
      border: "1px solid rgba(251,146,60,0.34)",
      background: "rgba(251,146,60,0.14)",
      color: "#fdba74",
    };
  }

  return {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.14)",
    color: "#fca5a5",
  };
}

function StateBadge({ state }: { state: CardState }) {
  const style = stateBadgeStyle(state);

  return (
    <span
      style={{
        padding: "5px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {state}
    </span>
  );
}

function TimelineEventCard({ event }: { event: BattleTimelineEvent }) {
  if (event.type === "ko") {
    return (
      <div
        style={{
          ...glassCard(),
          padding: 14,
          border: "1px solid rgba(239,68,68,0.24)",
          background: "linear-gradient(180deg, rgba(239,68,68,0.10), rgba(255,255,255,0.02))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#fca5a5",
            }}
          >
            KO Event
          </div>

          <div
            style={{
              padding: "5px 8px",
              borderRadius: 999,
              border: "1px solid rgba(239,68,68,0.24)",
              background: "rgba(239,68,68,0.12)",
              fontSize: 11,
              fontWeight: 800,
              color: "#fca5a5",
            }}
          >
            Round {event.payload.round}
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900 }}>
          {event.payload.name} was knocked out
        </div>

        <div
          style={{
            marginTop: 8,
            color: "rgba(255,255,255,0.76)",
            lineHeight: 1.45,
          }}
        >
          Defeated by {event.payload.defeatedBy}.
        </div>
      </div>
    );
  }

  const winnerStyle =
    event.payload.winner === "player"
      ? {
          border: "1px solid rgba(34,197,94,0.24)",
          background: "rgba(34,197,94,0.12)",
          color: "#86efac",
          label: "Player edge",
        }
      : event.payload.winner === "enemy"
        ? {
            border: "1px solid rgba(239,68,68,0.24)",
            background: "rgba(239,68,68,0.12)",
            color: "#fca5a5",
            label: "Enemy edge",
          }
        : {
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.82)",
            label: "Draw",
          };

  return (
    <div
      style={{
        ...glassCard(),
        padding: 14,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Round {event.payload.round} • Exchange {event.payload.exchange}
        </div>

        <div
          style={{
            padding: "5px 8px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            ...winnerStyle,
          }}
        >
          {winnerStyle.label}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 17, fontWeight: 900 }}>
        {event.payload.attackerName} vs {event.payload.defenderName}
      </div>

      <div
        style={{
          marginTop: 8,
          color: "rgba(255,255,255,0.76)",
          lineHeight: 1.5,
        }}
      >
        {event.payload.resultText}
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
            padding: 10,
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            Attacker after exchange
          </div>
          <StateBadge state={event.payload.attackerStateAfter} />
        </div>

        <div
          style={{
            padding: 10,
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            Defender after exchange
          </div>
          <StateBadge state={event.payload.defenderStateAfter} />
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
        }}
      >
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Player init
          </div>
          <div style={{ marginTop: 6, fontWeight: 800 }}>
            {event.payload.initiativeScore.player}
          </div>
        </div>

        <div
          style={{
            padding: 10,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Enemy init
          </div>
          <div style={{ marginTop: 6, fontWeight: 800 }}>
            {event.payload.initiativeScore.enemy}
          </div>
        </div>

        <div
          style={{
            padding: 10,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Clash
          </div>
          <div style={{ marginTop: 6, fontWeight: 800 }}>
            {event.payload.offenseScore} / {event.payload.defenseScore}
          </div>
        </div>
      </div>

      {event.payload.triggeredAbility && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(250,204,21,0.20)",
            background: "rgba(250,204,21,0.10)",
            color: "#fde68a",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Ability Triggered: {event.payload.triggeredAbility}
        </div>
      )}
    </div>
  );
}

export default function BattleResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<BattleResultData<FighterCard> | null>(null);
  const [walletAfter, setWalletAfter] = useState<number | null>(null);

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
    if (!setup) return;

    const simulated = simulateBattle(setup.mode, setup.playerDeck, setup.enemyDeck);
    saveBattleResult(simulated);
    setResult(simulated);

    const updatedWallet = addWalletCoins(simulated.rewardCoins);
    markBattleRewardApplied();
    setWalletAfter(updatedWallet);
  }, []);

  const accent = useMemo(() => {
    if (!result) return null;
    const win = result.winner === "player";

    return win
      ? {
          title: "Victory",
          color: "#86efac",
          border: "rgba(34,197,94,0.35)",
          bg: "linear-gradient(180deg, rgba(34,197,94,0.18), rgba(0,0,0,0.18))",
        }
      : {
          title: "Defeat",
          color: "#fca5a5",
          border: "rgba(239,68,68,0.35)",
          bg: "linear-gradient(180deg, rgba(239,68,68,0.18), rgba(0,0,0,0.18))",
        };
  }, [result]);

  if (!result || !accent) {
    return (
      <PageShell>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Loading battle result...</div>
        </div>
      </PageShell>
    );
  }

  const mvpTone = result.mvp ? rarityColors(result.mvp.rarity) : null;
  const headline = getBattleHeadline(result);
  const summary = getBattleSummaryText(result);

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            ...glassCard(),
            padding: 20,
            border: `1px solid ${accent.border}`,
            background: accent.bg,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Battle Result
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 40,
              fontWeight: 900,
              color: accent.color,
              lineHeight: 1,
            }}
          >
            {accent.title}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {headline}
          </div>

          <div
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.76)",
              lineHeight: 1.5,
            }}
          >
            {summary}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div style={{ ...glassCard(), padding: 14 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Reward</div>
              <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>
                {result.rewardCoins > 0 ? `+${result.rewardCoins}` : result.rewardCoins} Coins
              </div>
            </div>

            <div style={{ ...glassCard(), padding: 14 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Wallet</div>
              <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>
                {walletAfter ?? getWalletCoins()} Coins
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 16 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Match Stats
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div style={{ ...glassCard(), padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Your Score</div>
              <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>{result.playerScore}</div>
            </div>

            <div style={{ ...glassCard(), padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Enemy Score</div>
              <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>{result.enemyScore}</div>
            </div>

            <div style={{ ...glassCard(), padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Rounds</div>
              <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>{result.roundsPlayed}</div>
            </div>

            <div style={{ ...glassCard(), padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Enemy KO</div>
              <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>{result.kos.enemy}</div>
            </div>
          </div>
        </div>

        {result.mvp && mvpTone && (
          <div
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
                color: "rgba(255,255,255,0.76)",
                lineHeight: 1.45,
              }}
            >
              {result.mvp.rarity} • {result.mvp.type} • {result.mvp.universe}
            </div>
          </div>
        )}

        <div style={{ ...glassCard(), padding: 16 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Battle Log
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {result.timeline.map((event, index) => (
              <TimelineEventCard key={`${event.type}-${index}`} event={event} />
            ))}
          </div>
        </div>

        <TeamBlock title="Your Team" deck={result.playerDeck} />
        <TeamBlock title="Enemy Team" deck={result.enemyDeck} />

        <div style={{ ...glassCard(), padding: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <button onClick={() => router.push("/battle")} style={primaryButton()}>
              Battle Again
            </button>
            <button onClick={() => router.push("/")} style={secondaryButton()}>
              Back Home
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}