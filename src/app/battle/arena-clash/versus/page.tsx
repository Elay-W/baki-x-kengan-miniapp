"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PageShell from "@/components/PageShell";
import {
  glassCard,
  primaryButton,
  rarityColors,
  secondaryButton,
} from "@/components/ui";
import { cards } from "@/data/cards";
import { loadDeck } from "@/lib/deckStorage";
import {
  clearArenaClashSetup,
  saveArenaClashSetup,
} from "@/lib/arenaClashSetupStorage";
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

function buildArenaClashTeams(): {
  playerTeam: FighterCard[];
  enemyTeam: FighterCard[];
} {
  const savedDeck = loadDeck();
  const playerTeam = fillTeam(savedDeck, cards);

  const playerIds = new Set(playerTeam.map((card) => card.id));
  const enemyPool = shuffle(cards.filter((card) => !playerIds.has(card.id)));
  const enemyTeam = fillTeam(enemyPool.slice(0, TEAM_SIZE), enemyPool);

  return {
    playerTeam,
    enemyTeam,
  };
}

function StatChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: "8px 6px",
        textAlign: "center",
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
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function LeadCard({
  card,
  side,
}: {
  card: FighterCard;
  side: "player" | "enemy";
}) {
  const rarity = rarityColors(card.rarity);

  return (
    <div
      style={{
        ...glassCard(),
        padding: 18,
        display: "grid",
        gap: 14,
        border: `1px solid ${rarity.border}`,
        background: rarity.bg,
        minHeight: 320,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            side === "player"
              ? "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 45%)"
              : "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08), transparent 45%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "start",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Lead Fighter
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.02,
              marginTop: 6,
            }}
          >
            {card.name}
          </div>
          <div
            style={{
              fontSize: 14,
              opacity: 0.74,
              marginTop: 6,
            }}
          >
            {card.title}
          </div>
        </div>

        <div
          style={{
            padding: "7px 12px",
            borderRadius: 999,
            border: `1px solid ${rarity.border}`,
            color: rarity.text,
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: "nowrap",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {card.rarity}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <StatChip label="STR" value={card.stats.STR} />
        <StatChip label="SPD" value={card.stats.SPD} />
        <StatChip label="TECH" value={card.stats.TECH} />
        <StatChip label="DEF" value={card.stats.DEF} />
        <StatChip label="DUR" value={card.stats.DUR} />
        <StatChip label="INST" value={card.stats.INSTINCT} />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {card.type}
        </div>
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {card.universe}
        </div>
        <div
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {card.stars}★
        </div>
      </div>
    </div>
  );
}

function ReserveStrip({
  team,
  side,
}: {
  team: FighterCard[];
  side: "player" | "enemy";
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: 0.6,
        }}
      >
        {side === "player" ? "Player Reserves" : "Enemy Reserves"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        {team.slice(1).map((card, index) => {
          const rarity = rarityColors(card.rarity);

          return (
            <div
              key={`${side}-${card.id}`}
              style={{
                ...glassCard(),
                padding: 12,
                display: "grid",
                gap: 6,
                border: `1px solid ${rarity.border}`,
                background: rarity.bg,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
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
                    Reserve {index + 1}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{card.name}</div>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: rarity.text,
                  }}
                >
                  {card.rarity}
                </div>
              </div>

              <div style={{ fontSize: 12, opacity: 0.72 }}>{card.title}</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 6,
                }}
              >
                <StatChip label="STR" value={card.stats.STR} />
                <StatChip label="SPD" value={card.stats.SPD} />
                <StatChip label="TECH" value={card.stats.TECH} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamSide({
  label,
  team,
  side,
}: {
  label: string;
  team: FighterCard[];
  side: "player" | "enemy";
}) {
  return (
    <section
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: 0.6,
        }}
      >
        {label}
      </div>

      <LeadCard card={team[0]} side={side} />
      <ReserveStrip team={team} side={side} />
    </section>
  );
}

export default function ArenaClashVersusPage() {
  const router = useRouter();
  const [seed, setSeed] = useState(0);

  const teams = useMemo(() => buildArenaClashTeams(), [seed]);
  const isDeckReady = teams.playerTeam.length === 5;

  function handleStart() {
    if (!isDeckReady) {
      return;
    }

    clearArenaClashSetup();

    saveArenaClashSetup({
      playerDeck: teams.playerTeam,
      enemyDeck: teams.enemyTeam,
      savedAt: Date.now(),
    });

    router.push("/battle/arena-clash/match");
  }

  return (
    <PageShell>
      <main
        style={{
          padding: "16px 16px 120px",
          display: "grid",
          gap: 18,
        }}
      >
        <section
          style={{
            ...glassCard(),
            padding: 18,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Arena Clash
          </div>

          <div style={{ fontSize: 32, fontWeight: 900 }}>Versus Screen</div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              opacity: 0.76,
              maxWidth: 860,
            }}
          >
            Проверь лидов и резервы перед началом матча. После подтверждения именно
            этот матчап отправится в бой.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={handleStart} style={primaryButton()}>
              Enter Match
            </button>

            <button
              type="button"
              onClick={() => setSeed((value) => value + 1)}
              style={secondaryButton()}
            >
              Reroll Opponent
            </button>

            <button
              type="button"
              onClick={() => router.push("/battle/arena-clash")}
              style={secondaryButton()}
            >
              Back
            </button>
          </div>

          {!isDeckReady && (
            <div style={{ fontSize: 14, color: "#f87171", fontWeight: 700 }}>
              Your deck is incomplete. Build a full 5-card deck first.
            </div>
          )}
        </section>

        <section
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "minmax(0, 1fr) 120px minmax(0, 1fr)",
            alignItems: "start",
          }}
        >
          <TeamSide label="Player" team={teams.playerTeam} side="player" />

          <div
            style={{
              display: "grid",
              placeItems: "center",
              alignSelf: "center",
              minHeight: 240,
            }}
          >
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 0 40px rgba(255,255,255,0.08)",
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: "0.08em",
              }}
            >
              VS
            </div>
          </div>

          <TeamSide label="Enemy" team={teams.enemyTeam} side="enemy" />
        </section>
      </main>
    </PageShell>
  );
}