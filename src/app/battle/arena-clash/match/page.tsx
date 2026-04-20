"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ArenaFighterVisualCard from "@/components/ArenaFighterVisualCard";
import PageShell from "@/components/PageShell";
import StatBar from "@/components/StatBar";
import {
  glassCard,
  primaryButton,
  rarityColors,
  secondaryButton,
} from "@/components/ui";
import { cards } from "@/data/cards";
import { loadDeck } from "@/lib/deckStorage";
import {
  createArenaClashMatchState,
  resolveArenaClashStep,
} from "@/lib/arenaClashEngine";
import { getArenaClashSkillForCard } from "@/lib/arenaClashSkillRegistry";
import {
  clearArenaClashSetup,
  loadArenaClashSetup,
} from "@/lib/arenaClashSetupStorage";
import { saveArenaClashResult } from "@/lib/arenaClashStorage";
import {
  getArenaClashActiveCard,
  getArenaClashTempoCostByRarity,
  type ArenaClashActionSelection,
  type ArenaClashBattleCardRuntime,
  type ArenaClashExchangeResolution,
  type ArenaClashFighterCard,
  type ArenaClashMatchState,
  type ArenaClashTeamState,
} from "@/lib/arenaClashTypes";
import type { FighterCard } from "@/types/game";

const TEAM_SIZE = 5;

function uniqueCards(list: FighterCard[]): FighterCard[] {
  const seen = new Set<number>();
  const result: FighterCard[] = [];

  for (const card of list) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    result.push(card);
  }

  return result;
}

function fillTeam(base: FighterCard[], pool: FighterCard[], size = TEAM_SIZE): FighterCard[] {
  const result = uniqueCards(base);

  for (const card of pool) {
    if (result.length >= size) break;
    if (result.some((item) => item.id === card.id)) continue;
    result.push(card);
  }

  return result.slice(0, size);
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function createInitialTeams(): {
  playerTeam: ArenaClashFighterCard[];
  enemyTeam: ArenaClashFighterCard[];
} {
  const savedDeck = loadDeck();
  const playerTeam = fillTeam(savedDeck, cards);

  const playerIds = new Set(playerTeam.map((card) => card.id));
  const enemyPool = shuffle(cards.filter((card) => !playerIds.has(card.id)));
  const enemyTeam = fillTeam(enemyPool.slice(0, TEAM_SIZE), enemyPool);

  return {
    playerTeam: playerTeam as ArenaClashFighterCard[],
    enemyTeam: enemyTeam as ArenaClashFighterCard[],
  };
}

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

function formatStatuses(card: ArenaClashBattleCardRuntime): string {
  if (card.statuses.length === 0) return "None";

  return card.statuses
    .map((status) => `${status.type} (${status.durationExchanges})`)
    .join(", ");
}

function getSwitchTargets(team: ArenaClashTeamState) {
  return team.fighters.filter(
    (fighter) => fighter.slot !== team.activeSlot && fighter.state !== "KO",
  );
}

function buildEnemyAction(match: ArenaClashMatchState): ArenaClashActionSelection {
  const enemy = getArenaClashActiveCard(match.enemy);
  const player = getArenaClashActiveCard(match.player);
  const enemySkill = getArenaClashSkillForCard(enemy.card);
  const switchTargets = getSwitchTargets(match.enemy).filter(
    (fighter) => match.enemy.tempo >= getArenaClashTempoCostByRarity(fighter.rarity),
  );

  if (enemy.state === "Broken" && switchTargets.length > 0 && Math.random() < 0.45) {
    const target = switchTargets[0];
    return {
      type: "Switch",
      targetReserveSlot: target.slot,
    };
  }

  if (
    enemySkill &&
    enemy.focus >= enemySkill.focusCost &&
    enemy.state !== "Broken" &&
    Math.random() < 0.35
  ) {
    return {
      type: "Skill",
      skillKey: enemySkill.key,
    };
  }

  if (enemy.state === "Broken" && Math.random() < 0.35) {
    return { type: "Guard" };
  }

  if (enemy.focus <= 1 && player.state === "Ready" && Math.random() < 0.2) {
    return { type: "Charge" };
  }

  const roll = Math.random();

  if (roll < 0.55) return { type: "Strike" };
  if (roll < 0.75) return { type: "Guard" };
  if (roll < 0.9) return { type: "Charge" };

  if (switchTargets.length > 0) {
    return {
      type: "Switch",
      targetReserveSlot: switchTargets[0].slot,
    };
  }

  return { type: "Strike" };
}
function getStateVisual(state: ArenaClashBattleCardRuntime["state"]) {
  switch (state) {
    case "Ready":
      return {
        border: "rgba(255,255,255,0.12)",
        glow: "rgba(255,255,255,0.08)",
        bg: "rgba(255,255,255,0.03)",
      };
    case "Pressured":
      return {
        border: "rgba(250,204,21,0.45)",
        glow: "rgba(250,204,21,0.18)",
        bg: "rgba(250,204,21,0.08)",
      };
    case "Broken":
      return {
        border: "rgba(251,146,60,0.5)",
        glow: "rgba(251,146,60,0.2)",
        bg: "rgba(251,146,60,0.1)",
      };
    case "KO":
      return {
        border: "rgba(239,68,68,0.55)",
        glow: "rgba(239,68,68,0.22)",
        bg: "rgba(239,68,68,0.1)",
      };
    default:
      return {
        border: "rgba(255,255,255,0.12)",
        glow: "rgba(255,255,255,0.08)",
        bg: "rgba(255,255,255,0.03)",
      };
  }
}
function FighterPanel({
  title,
  fighter,
  teamTempo,
  isPlayer,
}: {
  title: string;
  fighter: ArenaClashBattleCardRuntime;
  teamTempo: number;
  isPlayer: boolean;
}) {
  const rarity = rarityColors(fighter.rarity);
  const arenaClashSkill = getArenaClashSkillForCard(fighter.card);
const stateVisual = getStateVisual(fighter.state);
return (
  <div
    style={{
      ...glassCard(),
      padding: 16,
      display: "grid",
      gap: 12,
      border: `1px solid ${stateVisual.border}`,
      background: `linear-gradient(180deg, ${stateVisual.bg}, ${rarity.bg})`,
      boxShadow: `0 0 28px ${stateVisual.glow}`,
      position: "relative",
      overflow: "hidden",
      animation: "arenaFighterStatePulse 320ms ease-out",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at 18% 18%, ${stateVisual.glow}, transparent 42%)`,
        pointerEvents: "none",
        opacity: fighter.state === "Ready" ? 0.7 : 1,
      }}
    />

    <div style={{ display: "grid", gap: 6 }}>
      ...
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{fighter.card.name}</div>
            <div style={{ fontSize: 13, opacity: 0.72 }}>{fighter.card.title}</div>
          </div>

          <div
  style={{
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    color: getStateColor(fighter.state),
    border: `1px solid ${getStateColor(fighter.state)}`,
    background: fighter.state === "KO" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
    boxShadow: fighter.state === "KO" ? "0 0 18px rgba(239,68,68,0.25)" : "none",
  }}
>
  {fighter.state}
</div>
        </div>
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
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 10,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6 }}>Rarity</div>
          <div style={{ fontWeight: 800, color: rarity.text }}>{fighter.rarity}</div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 10,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6 }}>Focus</div>
          <div style={{ fontWeight: 800 }}>{fighter.focus}</div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 10,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6 }}>Tempo</div>
          <div style={{ fontWeight: 800 }}>{teamTempo}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {Object.entries(fighter.card.stats).map(([label, value]) => (
          <StatBar key={`${fighter.card.id}-${label}`} label={label} value={value} />
        ))}
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14,
          padding: 10,
          display: "grid",
          gap: 6,
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.6 }}>Statuses</div>
        <div style={{ fontSize: 13 }}>{formatStatuses(fighter)}</div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14,
          padding: 10,
          display: "grid",
          gap: 6,
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.6 }}>Arena Clash Skill</div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          {arenaClashSkill ? arenaClashSkill.name : "Not mapped yet"}
        </div>
        <div style={{ fontSize: 12, opacity: 0.72 }}>
          {arenaClashSkill
            ? `${arenaClashSkill.type} • Cost ${arenaClashSkill.focusCost} Focus`
            : isPlayer
              ? "Align abilityKey/arenaClashSkillKey to enable Skill."
              : "Enemy will use Strike/Guard/Charge until mapped."}
        </div>
      </div>
    </div>
  );
}

function ArenaActionButton({
  eyebrow,
  title,
  subtitle,
  active,
  disabled,
  accent,
  onClick,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  active: boolean;
  disabled: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        textAlign: "left",
        padding: 14,
        borderRadius: 18,
        border: `1px solid ${active ? accent : "rgba(255,255,255,0.08)"}`,
        background: active
          ? `linear-gradient(180deg, ${accent}22, rgba(255,255,255,0.06))`
          : "rgba(255,255,255,0.04)",
        boxShadow: active ? `0 0 24px ${accent}33` : "none",
        opacity: disabled ? 0.42 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "grid",
        gap: 6,
        minHeight: 104,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: active
            ? `radial-gradient(circle at 15% 15%, ${accent}22, transparent 42%)`
            : "none",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: 0.58,
        }}
      >
        {eyebrow}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: 20,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {title}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: 12,
          lineHeight: 1.35,
          opacity: 0.74,
        }}
      >
        {subtitle}
      </div>
    </button>
  );
}

function getResolutionAccent(tier: ArenaClashExchangeResolution["resultTier"]) {
  switch (tier) {
    case "light":
      return {
        border: "rgba(250,204,21,0.55)",
        glow: "rgba(250,204,21,0.22)",
        text: "#fde047",
        bg: "rgba(250,204,21,0.08)",
      };
    case "clean":
      return {
        border: "rgba(96,165,250,0.55)",
        glow: "rgba(96,165,250,0.22)",
        text: "#93c5fd",
        bg: "rgba(96,165,250,0.08)",
      };
    case "crush":
      return {
        border: "rgba(239,68,68,0.55)",
        glow: "rgba(239,68,68,0.26)",
        text: "#fca5a5",
        bg: "rgba(239,68,68,0.1)",
      };
    default:
      return {
        border: "rgba(255,255,255,0.12)",
        glow: "rgba(255,255,255,0.08)",
        text: "#e5e7eb",
        bg: "rgba(255,255,255,0.04)",
      };
  }
}

function AnimatedResolutionCard({
  resolution,
}: {
  resolution: ArenaClashExchangeResolution;
}) {
  const accent = getResolutionAccent(resolution.resultTier);

  return (
    <div
      key={resolution.exchangeNumber}
      style={{
        ...glassCard(),
        padding: 16,
        display: "grid",
        gap: 14,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${accent.border}`,
        background: `linear-gradient(180deg, ${accent.bg}, rgba(255,255,255,0.03))`,
        boxShadow: `0 0 34px ${accent.glow}`,
        animation: "arenaResolutionIn 420ms ease-out",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 15% 20%, ${accent.glow}, transparent 42%)`,
          pointerEvents: "none",
          animation: "arenaResolutionGlow 2.2s ease-in-out infinite",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Exchange {resolution.exchangeNumber}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {resolution.winnerSide === "draw"
              ? "Stalemate"
              : resolution.winnerSide === "none"
                ? "No decisive edge"
                : `${resolution.winnerSide.toUpperCase()} seized the exchange`}
          </div>
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: `1px solid ${accent.border}`,
            color: accent.text,
            background: "rgba(255,255,255,0.04)",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {resolution.resultTier}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 10,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6 }}>Player Action</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{resolution.playerAction.type}</div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 10,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6 }}>Enemy Action</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{resolution.enemyAction.type}</div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: 10,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6 }}>Primary Clash</div>
          <div style={{ fontSize: 16, fontWeight: 900 }}>{resolution.primaryClash}</div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gap: 8,
        }}
      >
        {resolution.clashes.map((clash, index) => (
          <div
            key={`${resolution.exchangeNumber}-${clash.kind}-${index}`}
            style={{
              background: "rgba(255,255,255,0.045)",
              borderRadius: 14,
              padding: 12,
              display: "grid",
              gap: 4,
              border: "1px solid rgba(255,255,255,0.06)",
              animation: `arenaResolutionRowIn 380ms ease-out ${index * 80}ms both`,
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
              <div style={{ fontSize: 13, fontWeight: 900 }}>{clash.kind}</div>
              <div style={{ fontSize: 12, opacity: 0.72 }}>
                Winner: <strong>{clash.winnerSide}</strong>
              </div>
            </div>

            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {clash.attackerSide}: <strong>{clash.attackerValue}</strong>
              {"  "}vs{"  "}
              {clash.defenderSide}: <strong>{clash.defenderValue}</strong>
            </div>

            <div style={{ fontSize: 12, opacity: 0.72 }}>
              Difference: <strong>{clash.difference}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ArenaClashMatchPage() {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  const [match, setMatch] = useState<ArenaClashMatchState | null>(null);
  const [selectedAction, setSelectedAction] = useState<ArenaClashActionSelection>({
    type: "Strike",
  });

  const actionUi = {
    Strike: {
      eyebrow: "Offense",
      subtitle: "Standard aggressive exchange through stat clashes.",
      accent: "#ef4444",
    },
    Guard: {
      eyebrow: "Defense",
      subtitle: "Hold stance, reinforce defense, and punish weak pressure.",
      accent: "#60a5fa",
    },
    Charge: {
      eyebrow: "Tempo",
      subtitle: "Build Focus now, accept higher risk this exchange.",
      accent: "#a78bfa",
    },
    Skill: {
      eyebrow: "Signature",
      subtitle: "Spend Focus to alter a clash with your active skill.",
      accent: "#f59e0b",
    },
    Switch: {
      eyebrow: "Rotation",
      subtitle: "Bring a reserve in by spending Tempo.",
      accent: "#22c55e",
    },
  } as const;

  useEffect(() => {
    const savedSetup = loadArenaClashSetup();

    if (savedSetup?.playerDeck?.length && savedSetup?.enemyDeck?.length) {
      setMatch(
        createArenaClashMatchState(
          savedSetup.playerDeck as ArenaClashFighterCard[],
          savedSetup.enemyDeck as ArenaClashFighterCard[],
        ),
      );
      clearArenaClashSetup();
      return;
    }

    const { playerTeam, enemyTeam } = createInitialTeams();
    setMatch(createArenaClashMatchState(playerTeam, enemyTeam));
  }, []);

  const playerActive = useMemo(
    () => (match ? getArenaClashActiveCard(match.player) : null),
    [match],
  );

  const enemyActive = useMemo(
    () => (match ? getArenaClashActiveCard(match.enemy) : null),
    [match],
  );

  const playerSkill = useMemo(
    () => (playerActive ? getArenaClashSkillForCard(playerActive.card) : null),
    [playerActive],
  );

  const playerSwitchTargets = useMemo(() => {
    if (!match) return [];
    return getSwitchTargets(match.player);
  }, [match]);

  const canUseSelectedSkill =
    selectedAction.type !== "Skill" ||
    (playerSkill != null &&
      playerActive != null &&
      playerActive.focus >= playerSkill.focusCost);

  useEffect(() => {
    if (!match?.result || hasRedirectedRef.current) return;

    hasRedirectedRef.current = true;

    saveArenaClashResult({
      winner: match.result.winner,
      loser: match.result.loser,
      reason: match.result.reason,
      roundNumber: match.currentRound.roundNumber,
      exchangeNumber: match.exchangeNumber,
      playerRemaining: match.player.fighters.filter((fighter) => fighter.state !== "KO").length,
      enemyRemaining: match.enemy.fighters.filter((fighter) => fighter.state !== "KO").length,
      lastLogLines: match.battleLog.slice(-12),
      savedAt: Date.now(),
    });

    router.push("/battle/arena-clash/result");
  }, [match, router]);

  function restartMatch() {
    const { playerTeam, enemyTeam } = createInitialTeams();
    hasRedirectedRef.current = false;
    setMatch(createArenaClashMatchState(playerTeam, enemyTeam));
    setSelectedAction({ type: "Strike" });
  }

  function submitExchange() {
    if (!match || !playerActive || !enemyActive || match.result) return;

    if (selectedAction.type === "Switch" && selectedAction.targetReserveSlot == null) {
      return;
    }

    if (!canUseSelectedSkill) {
      return;
    }

    const enemyAction = buildEnemyAction(match);
    const next = resolveArenaClashStep(match, selectedAction, enemyAction);

    setMatch(next);
    setSelectedAction({ type: "Strike" });
  }

  if (!match || !playerActive || !enemyActive) {
    return (
      <PageShell>
        <main
          style={{
            minHeight: "100dvh",
            padding: 16,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div style={{ ...glassCard(), padding: 20, textAlign: "center" }}>
            Loading Arena Clash...
          </div>
        </main>
      </PageShell>
    );
  }

  const result = match.result;
  const lastResolution = match.lastResolution;

  return (
    <PageShell>
      <style jsx global>{`
        @keyframes arenaResolutionIn {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
@keyframes arenaFighterStatePulse {
  0% {
    opacity: 0.82;
    transform: translateY(6px) scale(0.992);
  }
  55% {
    opacity: 1;
    transform: translateY(0) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
        @keyframes arenaResolutionGlow {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }

        @keyframes arenaResolutionRowIn {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

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
            padding: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Arena Clash
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 900 }}>Arena Clash Match</div>
            <button type="button" onClick={restartMatch} style={secondaryButton()}>
              Restart
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6 }}>Round</div>
              <div style={{ fontWeight: 800 }}>{match.currentRound.roundNumber}</div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6 }}>Exchange</div>
              <div style={{ fontWeight: 800 }}>{match.exchangeNumber}</div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6 }}>Player Tempo</div>
              <div style={{ fontWeight: 800 }}>{match.player.tempo}</div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6 }}>Enemy Tempo</div>
              <div style={{ fontWeight: 800 }}>{match.enemy.tempo}</div>
            </div>
          </div>
        </section>

       <section
  style={{
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  }}
>
  <ArenaFighterVisualCard
    key={`${playerActive.card.id}-${playerActive.state}`}
    label="Player Active"
    fighter={playerActive}
    imageSrc={`/fighters/${playerActive.card.id}.png`}
  />

  <ArenaFighterVisualCard
    key={`${enemyActive.card.id}-${enemyActive.state}`}
    label="Enemy Active"
    fighter={enemyActive}
    imageSrc={`/fighters/${enemyActive.card.id}.png`}
  />
</section>

        <section
          style={{
            ...glassCard(),
            padding: 16,
            display: "grid",
            gap: 16,
            border: "1px solid rgba(255,255,255,0.1)",
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
            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Combat Command
              </div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Choose Your Action</div>
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Selected: {selectedAction.type}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
            }}
          >
            {(["Strike", "Guard", "Charge", "Skill", "Switch"] as const).map((type) => {
              const disabled =
                !!result ||
                (type === "Skill" && !playerSkill) ||
                (type === "Skill" &&
                  playerSkill != null &&
                  playerActive.focus < playerSkill.focusCost) ||
                (type === "Switch" &&
                  playerSwitchTargets.filter(
                    (fighter) =>
                      match.player.tempo >= getArenaClashTempoCostByRarity(fighter.rarity),
                  ).length === 0);

              const selected = selectedAction.type === type;
              const meta = actionUi[type];

              return (
                <ArenaActionButton
                  key={type}
                  eyebrow={meta.eyebrow}
                  title={type}
                  subtitle={meta.subtitle}
                  active={selected}
                  disabled={disabled}
                  accent={meta.accent}
                  onClick={() => {
                    if (disabled) return;
                    setSelectedAction((prev) => ({
                      type,
                      targetReserveSlot: type === "Switch" ? prev.targetReserveSlot : undefined,
                      skillKey: type === "Skill" && playerSkill ? playerSkill.key : undefined,
                    }));
                  }}
                />
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 12,
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Active Fighter
              </div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{playerActive.card.name}</div>
              <div style={{ fontSize: 13, opacity: 0.74 }}>{playerActive.card.title}</div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 12,
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Current Resources
              </div>
              <div style={{ fontSize: 13, opacity: 0.78 }}>
                Focus: <strong>{playerActive.focus}</strong>
              </div>
              <div style={{ fontSize: 13, opacity: 0.78 }}>
                Tempo: <strong>{match.player.tempo}</strong>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 12,
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                State Pressure
              </div>
              <div style={{ fontSize: 13, opacity: 0.78 }}>
                You: <strong>{playerActive.state}</strong>
              </div>
              <div style={{ fontSize: 13, opacity: 0.78 }}>
                Enemy: <strong>{enemyActive.state}</strong>
              </div>
            </div>
          </div>

          {selectedAction.type === "Skill" && (
            <div
              style={{
                borderRadius: 18,
                padding: 14,
                border: "1px solid rgba(245,158,11,0.35)",
                background:
                  "linear-gradient(180deg, rgba(245,158,11,0.12), rgba(255,255,255,0.04))",
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.62,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Signature Action
              </div>

              <div style={{ fontSize: 18, fontWeight: 900 }}>
                {playerSkill ? playerSkill.name : "No mapped skill"}
              </div>

              <div style={{ fontSize: 13, opacity: 0.78 }}>
                {playerSkill
                  ? `${playerSkill.type} • Cost ${playerSkill.focusCost} Focus`
                  : "Map this fighter in arenaClashSkillRegistry to enable Skill."}
              </div>

              {playerSkill && (
                <div style={{ fontSize: 13, lineHeight: 1.45, opacity: 0.72 }}>
                  {playerSkill.description}
                </div>
              )}
            </div>
          )}

          {selectedAction.type === "Switch" && (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.62,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Reserve Selection
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 10,
                }}
              >
                {playerSwitchTargets.map((fighter) => {
                  const cost = getArenaClashTempoCostByRarity(fighter.rarity);
                  const disabled = match.player.tempo < cost;
                  const selected = selectedAction.targetReserveSlot === fighter.slot;
                  const rarity = rarityColors(fighter.rarity);

                  return (
                    <button
                      key={fighter.card.id}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        setSelectedAction({
                          type: "Switch",
                          targetReserveSlot: fighter.slot,
                        })
                      }
                      style={{
                        textAlign: "left",
                        padding: 14,
                        borderRadius: 16,
                        border: `1px solid ${
                          selected ? rarity.text : disabled ? "rgba(255,255,255,0.08)" : rarity.border
                        }`,
                        background: selected ? rarity.bg : "rgba(255,255,255,0.04)",
                        opacity: disabled ? 0.45 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                        display: "grid",
                        gap: 6,
                        boxShadow: selected ? `0 0 20px ${rarity.border}33` : "none",
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{fighter.card.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.72 }}>{fighter.card.title}</div>
                      <div style={{ fontSize: 12, color: rarity.text }}>
                        {fighter.rarity} • Cost {cost} Tempo
                      </div>
                      <div style={{ fontSize: 12, color: getStateColor(fighter.state) }}>
                        {fighter.state}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={
              !!result ||
              !canUseSelectedSkill ||
              (selectedAction.type === "Switch" &&
                selectedAction.targetReserveSlot == null)
            }
            onClick={submitExchange}
            style={{
              ...primaryButton(),
              width: "100%",
              minHeight: 58,
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: "0.04em",
              opacity:
                result ||
                !canUseSelectedSkill ||
                (selectedAction.type === "Switch" &&
                  selectedAction.targetReserveSlot == null)
                  ? 0.5
                  : 1,
              cursor:
                result ||
                !canUseSelectedSkill ||
                (selectedAction.type === "Switch" &&
                  selectedAction.targetReserveSlot == null)
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Resolve Exchange
          </button>
        </section>

        <section
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900 }}>Last Resolution</div>

            {lastResolution ? (
              <AnimatedResolutionCard resolution={lastResolution} />
            ) : (
              <div
                style={{
                  ...glassCard(),
                  padding: 16,
                  opacity: 0.72,
                }}
              >
                No exchanges resolved yet.
              </div>
            )}
          </div>

          <div
            style={{
              ...glassCard(),
              padding: 16,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900 }}>Battle Log</div>

            <div
              style={{
                display: "grid",
                gap: 8,
                maxHeight: 520,
                overflowY: "auto",
              }}
            >
              {[...match.battleLog]
                .slice(-18)
                .reverse()
                .map((line, index) => (
                  <div
                    key={`${index}-${line}`}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 12,
                      padding: 10,
                      fontSize: 13,
                      lineHeight: 1.35,
                      animation: `arenaResolutionRowIn 260ms ease-out ${index * 24}ms both`,
                    }}
                  >
                    {line}
                  </div>
                ))}
            </div>
          </div>
        </section>

        {result && (
          <section
            style={{
              ...glassCard(),
              padding: 18,
              display: "grid",
              gap: 12,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              Match Result
            </div>

            <div style={{ fontSize: 26, fontWeight: 900 }}>
              {result.winner ? `${result.winner.toUpperCase()} WINS` : "DRAW"}
            </div>

            <div style={{ fontSize: 14, opacity: 0.78 }}>
              Reason: {result.reason}
            </div>

            <button type="button" onClick={restartMatch} style={primaryButton()}>
              Start New Match
            </button>
          </section>
        )}
      </main>
    </PageShell>
  );
}