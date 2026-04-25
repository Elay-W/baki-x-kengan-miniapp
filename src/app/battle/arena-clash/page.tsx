"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton } from "@/components/ui";
import { cards } from "@/data/cards";
import { loadDeck } from "@/lib/deckStorage";
import type { FighterCard } from "@/types/game";

const BOARD_SLOTS = 5;

type ClashAction = "strike" | "charge" | "guard" | "burst";
type Phase = "deploy" | "enemy-deploy" | "battle" | "finished";
type Side = "player" | "enemy";
type Winner = "player" | "enemy" | null;
type BoardSlot = ArenaUnit | null;

type ArenaUnit = {
  uid: string;
  slot: number;
  side: Side;
  base: FighterCard;
  hp: number;
  maxHp: number;
  force: number;
  tempo: number;
  guarding: boolean;
  knocked: boolean;
  lastAction: ClashAction | null;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function emptyBoard(): BoardSlot[] {
  return Array.from({ length: BOARD_SLOTS }, () => null);
}

function makeUnit(card: FighterCard, slot: number, side: Side): ArenaUnit {
  const maxHp = 100 + card.stats.DUR * 9 + card.stats.DEF * 6;
  const force = clamp(30 + card.stats.STR * 5 + card.stats.TECH * 2);
  const tempo = clamp(22 + card.stats.SPD * 5 + card.stats.TECH * 2);

  return {
    uid: `${side}-${slot}-${card.id}`,
    slot,
    side,
    base: card,
    hp: maxHp,
    maxHp,
    force,
    tempo,
    guarding: false,
    knocked: false,
    lastAction: null,
  };
}

function isUnitAlive(unit: BoardSlot): unit is ArenaUnit {
  return Boolean(unit && !unit.knocked && unit.hp > 0);
}

function boardHasLivingUnits(board: BoardSlot[]) {
  return board.some((unit) => isUnitAlive(unit));
}

function getPlayerCards(savedDeck: FighterCard[]) {
  const picked = [...savedDeck];
  const seen = new Set(picked.map((card) => card.id));

  if (picked.length < BOARD_SLOTS) {
    for (const card of cards) {
      if (seen.has(card.id)) continue;
      picked.push(card);
      seen.add(card.id);
      if (picked.length >= BOARD_SLOTS) break;
    }
  }

  return picked.slice(0, BOARD_SLOTS);
}

function getEnemyCards(playerCards: FighterCard[]) {
  const playerIds = new Set(playerCards.map((card) => card.id));

  return [...cards]
    .filter((card) => !playerIds.has(card.id))
    .sort((a, b) => {
      const aPower = a.stats.STR + a.stats.SPD + a.stars;
      const bPower = b.stats.STR + b.stats.SPD + b.stars;
      return bPower - aPower;
    })
    .slice(0, BOARD_SLOTS);
}

function shortName(name: string) {
  return name.length > 11 ? `${name.slice(0, 11)}…` : name;
}

function fullActionLabel(action: ClashAction) {
  switch (action) {
    case "strike":
      return "Strike";
    case "charge":
      return "Charge";
    case "guard":
      return "Guard";
    case "burst":
      return "Burst";
    default:
      return action;
  }
}

function actionAccent(action: ClashAction) {
  switch (action) {
    case "strike":
      return "#ff705c";
    case "charge":
      return "#ffb357";
    case "guard":
      return "#62c9ff";
    case "burst":
      return "#cf7cff";
    default:
      return "#ffffff";
  }
}

function pickEnemyAction(unit: ArenaUnit): ClashAction {
  if (unit.knocked) return "guard";
  if (unit.tempo >= 62) {
    const pool: ClashAction[] = ["strike", "burst", "charge", "strike"];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const pool: ClashAction[] = ["strike", "strike", "charge", "guard"];
  return pool[Math.floor(Math.random() * pool.length)];
}

function firstAliveIndex(board: BoardSlot[]) {
  return board.findIndex((unit) => isUnitAlive(unit));
}

function targetIndexFor(slot: number, board: BoardSlot[]) {
  if (isUnitAlive(board[slot])) return slot;
  return firstAliveIndex(board);
}

function cloneBoard(board: BoardSlot[]) {
  return board.map((unit) => (unit ? { ...unit } : null));
}

function resolveArenaRound(params: {
  playerBoard: BoardSlot[];
  enemyBoard: BoardSlot[];
  playerActions: Record<number, ClashAction>;
}) {
  const playerBoard = cloneBoard(params.playerBoard).map((unit) =>
    unit ? { ...unit, guarding: false } : null,
  );
  const enemyBoard = cloneBoard(params.enemyBoard).map((unit) =>
    unit ? { ...unit, guarding: false } : null,
  );

  const enemyActions: Record<number, ClashAction> = {};

  enemyBoard.forEach((unit, index) => {
    if (!unit) return;
    enemyActions[index] = pickEnemyAction(unit);
  });

  const playerActions: Record<number, ClashAction> = {};
  playerBoard.forEach((unit, index) => {
    if (!unit) return;
    playerActions[index] = params.playerActions[index] ?? "strike";
  });

  const log: string[] = [];

  function applyPrep(board: BoardSlot[], actions: Record<number, ClashAction>, sideLabel: string) {
    board.forEach((unit, index) => {
      if (!unit || unit.knocked || unit.hp <= 0) return;

      const action = actions[index];
      unit.lastAction = action;

      if (action === "charge") {
        unit.force = clamp(unit.force + 12);
        unit.tempo = clamp(unit.tempo + 16);
        log.push(`${sideLabel} ${unit.base.name} uses Charge.`);
      }

      if (action === "guard") {
        unit.guarding = true;
        unit.force = clamp(unit.force + 5);
        unit.tempo = clamp(unit.tempo + 8);
        log.push(`${sideLabel} ${unit.base.name} takes Guard.`);
      }
    });
  }

  applyPrep(playerBoard, playerActions, "Your");
  applyPrep(enemyBoard, enemyActions, "Enemy");

  const turnOrder: Array<{
    side: Side;
    slot: number;
    action: ClashAction;
    initiative: number;
  }> = [];

  playerBoard.forEach((unit, slot) => {
    if (!isUnitAlive(unit)) return;
    const action = playerActions[slot] ?? "strike";

    turnOrder.push({
      side: "player",
      slot,
      action,
      initiative:
        unit.tempo +
        (action === "burst" ? 20 : action === "strike" ? 10 : action === "charge" ? 6 : 2),
    });
  });

  enemyBoard.forEach((unit, slot) => {
    if (!isUnitAlive(unit)) return;
    const action = enemyActions[slot] ?? "strike";

    turnOrder.push({
      side: "enemy",
      slot,
      action,
      initiative:
        unit.tempo +
        (action === "burst" ? 20 : action === "strike" ? 10 : action === "charge" ? 6 : 2),
    });
  });

  turnOrder.sort((a, b) => b.initiative - a.initiative);

  for (const turn of turnOrder) {
    const ownBoard = turn.side === "player" ? playerBoard : enemyBoard;
    const targetBoard = turn.side === "player" ? enemyBoard : playerBoard;
    const attacker = ownBoard[turn.slot];

    if (!isUnitAlive(attacker)) continue;
    if (!boardHasLivingUnits(targetBoard)) continue;
    if (turn.action === "guard" || turn.action === "charge") continue;

    let actualAction = turn.action;
    if (actualAction === "burst" && attacker.tempo < 35) {
      actualAction = "strike";
    }

    const targetIndex = targetIndexFor(turn.slot, targetBoard);
    if (targetIndex === -1) continue;

    const target = targetBoard[targetIndex];
    if (!isUnitAlive(target)) continue;

    let damage = 0;

    if (actualAction === "strike") {
      damage = Math.round(
        attacker.base.stats.STR * 3.8 +
          attacker.base.stats.TECH * 1.8 +
          attacker.force * 0.42,
      );
      attacker.force = clamp(attacker.force + 4);
      attacker.tempo = clamp(attacker.tempo - 10);
    }

    if (actualAction === "burst") {
      damage = Math.round(
        attacker.base.stats.STR * 4.6 +
          attacker.base.stats.TECH * 2.4 +
          attacker.force * 0.55 +
          attacker.tempo * 0.5,
      );
      attacker.force = clamp(attacker.force + 6);
      attacker.tempo = clamp(attacker.tempo - 28);
    }

    if (target.guarding) {
      damage = Math.round(damage * 0.68);
    }

    target.hp = Math.max(0, target.hp - damage);
    if (target.hp <= 0) {
      target.knocked = true;
    }

    log.push(
      `${turn.side === "player" ? "Your" : "Enemy"} ${attacker.base.name} uses ${fullActionLabel(
        actualAction,
      )} on ${target.base.name} for ${damage} dmg.`,
    );

    if (target.knocked) {
      log.push(`${target.base.name} is knocked out.`);
    }
  }

  playerBoard.forEach((unit) => {
    if (!unit || unit.knocked) return;
    unit.tempo = clamp(unit.tempo + 6);
  });

  enemyBoard.forEach((unit) => {
    if (!unit || unit.knocked) return;
    unit.tempo = clamp(unit.tempo + 6);
  });

  let winner: Winner = null;
  if (!boardHasLivingUnits(enemyBoard)) winner = "player";
  if (!boardHasLivingUnits(playerBoard)) winner = "enemy";

  return {
    playerBoard,
    enemyBoard,
    playerActions,
    enemyActions,
    log: log.slice(-8),
    winner,
  };
}

function Meter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 4,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: "0.02em",
          opacity: 0.82,
        }}
      >
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>

      <div
        style={{
          height: 7,
          borderRadius: 999,
          background: "rgba(255,255,255,0.07)",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clamp(value)}%`,
            borderRadius: 999,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function MicroActionButton({
  label,
  active,
  color,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minHeight: 24,
        borderRadius: 8,
        border: active ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.08)",
        background: active ? `${color}20` : "rgba(255,255,255,0.03)",
        color: active ? color : "rgba(255,255,255,0.88)",
        fontSize: 8,
        fontWeight: 900,
        letterSpacing: "0.05em",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all .16s ease",
      }}
    >
      {label}
    </button>
  );
}

function HandCard({
  unit,
  selected,
  onClick,
}: {
  unit: ArenaUnit;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...glassCard(),
        padding: 6,
        display: "grid",
        gap: 6,
        textAlign: "left",
        border: selected
          ? "1px solid rgba(255,180,75,0.48)"
          : "1px solid rgba(255,255,255,0.08)",
        background: selected
          ? "linear-gradient(180deg, rgba(48,28,14,0.96), rgba(12,11,14,0.98))"
          : "linear-gradient(180deg, rgba(18,18,22,0.96), rgba(9,9,12,0.98))",
        transform: selected ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: selected
          ? "0 10px 22px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,170,65,0.08)"
          : "none",
        transition: "all .18s ease",
      }}
    >
      <div
        style={{
          borderRadius: 10,
          overflow: "hidden",
          aspectRatio: "0.72 / 1",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
        }}
      >
        <img
          src={`/fighters/${unit.base.id}.png`}
          alt={unit.base.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.16) 40%, rgba(0,0,0,0.68) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            bottom: 6,
            display: "grid",
            gap: 3,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              lineHeight: 1.02,
            }}
          >
            {shortName(unit.base.name)}
          </div>

          <div
            style={{
              fontSize: 8,
              opacity: 0.8,
            }}
          >
            {unit.base.stars}★ • {unit.base.rarity}
          </div>
        </div>
      </div>
    </button>
  );
}

function SlotCard({
  unit,
  side,
  phase,
  queuedAction,
  onPickAction,
  onRemoveDuringDeploy,
  animated,
}: {
  unit: BoardSlot;
  side: Side;
  phase: Phase;
  queuedAction?: ClashAction;
  onPickAction?: (action: ClashAction) => void;
  onRemoveDuringDeploy?: () => void;
  animated?: boolean;
}) {
  if (!unit) return null;

  const playerSide = side === "player";
  const knockout = unit.knocked || unit.hp <= 0;
  const hpPercent = (unit.hp / unit.maxHp) * 100;
  const burstAvailable = unit.tempo >= 40;
  const effectiveQueuedAction =
    playerSide && phase === "battle" ? queuedAction ?? "strike" : unit.lastAction;

  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        animation: animated ? "arena-slot-drop .28s cubic-bezier(.2,.8,.25,1)" : undefined,
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "0.7 / 1",
          background: "rgba(255,255,255,0.04)",
          border: playerSide
            ? "1px solid rgba(255,186,86,0.34)"
            : "1px solid rgba(255,94,94,0.28)",
          boxShadow: playerSide
            ? "inset 0 0 18px rgba(255,176,65,0.08)"
            : "inset 0 0 18px rgba(255,80,80,0.08)",
        }}
      >
        <img
          src={`/fighters/${unit.base.id}.png`}
          alt={unit.base.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: knockout ? "grayscale(1) brightness(0.5)" : "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0.72) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 5,
            left: 5,
            right: 5,
            display: "flex",
            justifyContent: "space-between",
            gap: 4,
            alignItems: "center",
          }}
        >
          <div
            style={{
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 8,
              fontWeight: 900,
            }}
          >
            {unit.slot + 1}
          </div>

          <div
            style={{
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: knockout
                ? "rgba(255,75,75,0.18)"
                : "rgba(0,0,0,0.55)",
              border: knockout
                ? "1px solid rgba(255,75,75,0.36)"
                : "1px solid rgba(255,255,255,0.08)",
              fontSize: 8,
              fontWeight: 900,
            }}
          >
            {knockout ? "KO" : `${unit.base.stars}★`}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            bottom: 6,
            display: "grid",
            gap: 3,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              lineHeight: 1.02,
              textShadow: "0 2px 8px rgba(0,0,0,0.55)",
            }}
          >
            {shortName(unit.base.name)}
          </div>

          <div
            style={{
              fontSize: 7,
              opacity: 0.82,
              lineHeight: 1.05,
            }}
          >
            {unit.base.title}
          </div>
        </div>

        {phase === "deploy" && playerSide && (
          <button
            type="button"
            onClick={onRemoveDuringDeploy}
            style={{
              position: "absolute",
              inset: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Remove from slot"
          />
        )}
      </div>

      {phase === "battle" || phase === "finished" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 4,
            }}
          >
            <MicroActionButton
              label="STR"
              color={actionAccent("strike")}
              active={effectiveQueuedAction === "strike"}
              disabled={!playerSide || knockout || phase === "finished"}
              onClick={playerSide ? () => onPickAction?.("strike") : undefined}
            />
            <MicroActionButton
              label="CHG"
              color={actionAccent("charge")}
              active={effectiveQueuedAction === "charge"}
              disabled={!playerSide || knockout || phase === "finished"}
              onClick={playerSide ? () => onPickAction?.("charge") : undefined}
            />
            <MicroActionButton
              label={burstAvailable ? "BST" : "GRD"}
              color={actionAccent(burstAvailable ? "burst" : "guard")}
              active={effectiveQueuedAction === (burstAvailable ? "burst" : "guard")}
              disabled={!playerSide || knockout || phase === "finished"}
              onClick={
                playerSide
                  ? () => onPickAction?.(burstAvailable ? "burst" : "guard")
                  : undefined
              }
            />
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <Meter
              label="HP"
              value={hpPercent}
              color="linear-gradient(90deg, #ff7c68 0%, #ff4335 100%)"
            />
            <Meter
              label="FRC"
              value={unit.force}
              color="linear-gradient(90deg, #ffad45 0%, #ff6a31 100%)"
            />
            <Meter
              label="TMP"
              value={unit.tempo}
              color="linear-gradient(90deg, #42c7ff 0%, #2177ff 100%)"
            />
          </div>
        </>
      ) : (
        <div
          style={{
            minHeight: 34,
            borderRadius: 10,
            border: "1px dashed rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            display: "grid",
            placeItems: "center",
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: "0.04em",
            opacity: 0.74,
          }}
        >
          {playerSide ? "TAP CARD TO REMOVE" : "ENEMY READY"}
        </div>
      )}
    </div>
  );
}

function EmptySlot({
  side,
  slotIndex,
  canPlace,
  active,
  phase,
  onClick,
}: {
  side: Side;
  slotIndex: number;
  canPlace: boolean;
  active: boolean;
  phase: Phase;
  onClick?: () => void;
}) {
  const playerSide = side === "player";

  return (
    <button
      type="button"
      disabled={!playerSide || !canPlace || phase !== "deploy"}
      onClick={onClick}
      style={{
        display: "grid",
        gap: 6,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: playerSide && canPlace && phase === "deploy" ? "pointer" : "default",
        opacity: playerSide ? 1 : 0.72,
      }}
    >
      <div
        style={{
          borderRadius: 12,
          aspectRatio: "0.7 / 1",
          border: active
            ? "1px solid rgba(255,185,80,0.5)"
            : "1px dashed rgba(255,255,255,0.12)",
          background: active
            ? "linear-gradient(180deg, rgba(64,36,14,0.58), rgba(18,16,14,0.72))"
            : "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(0,0,0,0.12))",
          boxShadow: active ? "0 0 20px rgba(255,173,65,0.08)" : "none",
          display: "grid",
          placeItems: "center",
          transition: "all .18s ease",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 4,
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 10,
              fontWeight: 900,
            }}
          >
            {slotIndex + 1}
          </div>

          <div
            style={{
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: "0.05em",
              opacity: 0.78,
            }}
          >
            {playerSide
              ? phase === "deploy"
                ? "PLACE"
                : "EMPTY"
              : phase === "enemy-deploy"
                ? "DEPLOY..."
                : "EMPTY"}
          </div>
        </div>
      </div>

      <div
        style={{
          minHeight: 34,
          borderRadius: 10,
          border: "1px dashed rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          display: "grid",
          placeItems: "center",
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.04em",
          opacity: 0.62,
        }}
      >
        SLOT
      </div>
    </button>
  );
}

export default function ArenaClashPage() {
  const router = useRouter();
  const enemyTimersRef = useRef<number[]>([]);

  const [phase, setPhase] = useState<Phase>("deploy");
  const [winner, setWinner] = useState<Winner>(null);
  const [round, setRound] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);

  const [playerHand, setPlayerHand] = useState<ArenaUnit[]>([]);
  const [playerBoard, setPlayerBoard] = useState<BoardSlot[]>(emptyBoard());
  const [enemyReserve, setEnemyReserve] = useState<ArenaUnit[]>([]);
  const [enemyBoard, setEnemyBoard] = useState<BoardSlot[]>(emptyBoard());

  const [selectedHandUid, setSelectedHandUid] = useState<string | null>(null);
  const [queuedActions, setQueuedActions] = useState<Record<number, ClashAction>>({});
  const [battleLog, setBattleLog] = useState<string[]>([
    "Deploy your 5 cards onto the table.",
  ]);

  const [animatedKeys, setAnimatedKeys] = useState<string[]>([]);

  function clearEnemyTimers() {
    enemyTimersRef.current.forEach((id) => window.clearTimeout(id));
    enemyTimersRef.current = [];
  }

  function pingAnimate(key: string) {
    setAnimatedKeys((prev) => [...prev, key]);
    window.setTimeout(() => {
      setAnimatedKeys((prev) => prev.filter((item) => item !== key));
    }, 320);
  }

  function buildFreshMatch() {
    clearEnemyTimers();

    const savedDeck = loadDeck();
    const playerCards = getPlayerCards(savedDeck);
    const enemyCards = getEnemyCards(playerCards);

    setPlayerHand(playerCards.map((card, index) => makeUnit(card, -1 - index, "player")));
    setPlayerBoard(emptyBoard());

    setEnemyReserve(enemyCards.map((card, index) => makeUnit(card, index, "enemy")));
    setEnemyBoard(emptyBoard());

    setSelectedHandUid(null);
    setQueuedActions({});
    setBattleLog(["Deploy your 5 cards onto the table."]);
    setWinner(null);
    setRound(1);
    setPhase("deploy");
  }

  useEffect(() => {
    buildFreshMatch();
    setIsHydrated(true);

    return () => {
      clearEnemyTimers();
    };
  }, []);

  const playerPlacedCount = useMemo(
    () => playerBoard.filter((slot) => slot !== null).length,
    [playerBoard],
  );

  const playerReady = playerPlacedCount === BOARD_SLOTS;
  const selectedHandCard = useMemo(
    () => playerHand.find((card) => card.uid === selectedHandUid) ?? null,
    [playerHand, selectedHandUid],
  );

  function placeSelectedToSlot(slotIndex: number) {
    if (phase !== "deploy") return;
    if (!selectedHandCard) return;
    if (playerBoard[slotIndex]) return;

    const placed: ArenaUnit = {
      ...selectedHandCard,
      slot: slotIndex,
      uid: `player-${slotIndex}-${selectedHandCard.base.id}`,
    };

    setPlayerBoard((prev) => {
      const next = [...prev];
      next[slotIndex] = placed;
      return next;
    });

    setPlayerHand((prev) => prev.filter((card) => card.uid !== selectedHandCard.uid));
    setSelectedHandUid(null);
    pingAnimate(`player-slot-${slotIndex}`);
  }

  function removeFromSlot(slotIndex: number) {
    if (phase !== "deploy") return;
    const slot = playerBoard[slotIndex];
    if (!slot) return;

    const backToHand: ArenaUnit = {
      ...slot,
      slot: -1 - playerHand.length,
      uid: `hand-${slot.base.id}-${Date.now()}-${slotIndex}`,
    };

    setPlayerBoard((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });

    setPlayerHand((prev) => [...prev, backToHand]);
  }

  function beginEnemyDeployment() {
    if (!playerReady || phase !== "deploy") return;

    setPhase("enemy-deploy");
    setBattleLog(["Enemy is placing cards onto the table..."]);

    enemyReserve.forEach((unit, index) => {
      const timer = window.setTimeout(() => {
        const placed: ArenaUnit = {
          ...unit,
          slot: index,
          uid: `enemy-${index}-${unit.base.id}`,
        };

        setEnemyBoard((prev) => {
          const next = [...prev];
          next[index] = placed;
          return next;
        });

        pingAnimate(`enemy-slot-${index}`);

        if (index === enemyReserve.length - 1) {
          window.setTimeout(() => {
            setPhase("battle");
            setBattleLog([
              "Arena Clash begins.",
              "Choose actions under your cards and press End Turn.",
            ]);
          }, 240);
        }
      }, index * 220);

      enemyTimersRef.current.push(timer);
    });
  }

  function setCardAction(slotIndex: number, action: ClashAction) {
    if (phase !== "battle" || winner) return;
    const slot = playerBoard[slotIndex];
    if (!slot || slot.knocked) return;

    setQueuedActions((prev) => ({
      ...prev,
      [slotIndex]: action,
    }));
  }

  function endTurn() {
    if (phase !== "battle" || winner) return;

    const result = resolveArenaRound({
      playerBoard,
      enemyBoard,
      playerActions: queuedActions,
    });

    setPlayerBoard(result.playerBoard);
    setEnemyBoard(result.enemyBoard);
    setBattleLog(result.log);
    setQueuedActions({});
    setWinner(result.winner);

    if (result.winner) {
      setPhase("finished");
      setBattleLog((prev) => [
        ...prev,
        result.winner === "player" ? "You won Arena Clash." : "You lost Arena Clash.",
      ]);
    } else {
      setRound((prev) => prev + 1);
    }
  }

  const phaseLabel = useMemo(() => {
    if (phase === "deploy") return "Deploy Phase";
    if (phase === "enemy-deploy") return "Enemy Deploying";
    if (phase === "battle") return "Battle Phase";
    if (winner === "player") return "Victory";
    if (winner === "enemy") return "Defeat";
    return "Arena Clash";
  }, [phase, winner]);

  return (
    <PageShell showHUD={false} showBottomNav={false}>
      <section
        style={{
          ...glassCard(),
          padding: 10,
          display: "grid",
          gap: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(14,14,18,0.98) 0%, rgba(18,13,11,0.98) 100%)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.03) inset, 0 18px 50px rgba(0,0,0,0.42)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                opacity: 0.66,
              }}
            >
              Arena Crash
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              Round {round}
            </div>

            <div
              style={{
                fontSize: 13,
                opacity: 0.78,
              }}
            >
              {phaseLabel}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <button type="button" onClick={() => router.push("/battle")} style={secondaryButton()}>
              Back
            </button>
            <button type="button" onClick={buildFreshMatch} style={secondaryButton()}>
              Reset
            </button>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            borderRadius: 24,
            padding: 10,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(40,29,24,0.98) 0%, rgba(18,18,21,1) 48%, rgba(38,28,22,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 70px rgba(255,112,55,0.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 10,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.04)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 10,
              right: 10,
              top: "49.5%",
              height: 2,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,132,80,0.22) 50%, rgba(255,255,255,0.02) 100%)",
              boxShadow: "0 0 14px rgba(255,108,52,0.12)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 12,
              bottom: 12,
              left: 6,
              width: 10,
              borderRadius: 999,
              background:
                "linear-gradient(180deg, rgba(255,90,70,0.22) 0%, rgba(255,255,255,0.02) 50%, rgba(255,186,75,0.14) 100%)",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.35)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 12,
              bottom: 12,
              right: 6,
              width: 10,
              borderRadius: 999,
              background:
                "linear-gradient(180deg, rgba(255,90,70,0.22) 0%, rgba(255,255,255,0.02) 50%, rgba(255,186,75,0.14) 100%)",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.35)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "grid",
              gap: 12,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Enemy Side
              </div>

              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background:
                    winner === "enemy"
                      ? "rgba(255,78,78,0.16)"
                      : "rgba(255,255,255,0.04)",
                  border:
                    winner === "enemy"
                      ? "1px solid rgba(255,78,78,0.35)"
                      : "1px solid rgba(255,255,255,0.08)",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {winner === "enemy" ? "Enemy Control" : "Top Lane"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 5,
              }}
            >
              {enemyBoard.map((unit, index) =>
                unit ? (
                  <SlotCard
                    key={`enemy-${index}`}
                    unit={unit}
                    side="enemy"
                    phase={phase}
                    animated={animatedKeys.includes(`enemy-slot-${index}`)}
                  />
                ) : (
                  <EmptySlot
                    key={`enemy-empty-${index}`}
                    side="enemy"
                    slotIndex={index}
                    canPlace={false}
                    active={false}
                    phase={phase}
                  />
                ),
              )}
            </div>

            <div
              style={{
                minHeight: 74,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.06)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,126,68,0.05) 100%)",
                display: "grid",
                placeItems: "center",
                boxShadow:
                  "inset 0 0 28px rgba(255,255,255,0.03), inset 0 -24px 40px rgba(255,104,32,0.08)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 4,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    opacity: 0.68,
                  }}
                >
                  Iron Table
                </div>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: "#ff7e61",
                    textShadow: "0 0 18px rgba(255,110,70,0.16)",
                  }}
                >
                  ARENA CRASH
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Your Side
              </div>

              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background:
                    winner === "player"
                      ? "rgba(255,180,60,0.14)"
                      : "rgba(255,255,255,0.04)",
                  border:
                    winner === "player"
                      ? "1px solid rgba(255,180,60,0.36)"
                      : "1px solid rgba(255,255,255,0.08)",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {winner === "player" ? "Table Dominated" : "Bottom Lane"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 5,
              }}
            >
              {playerBoard.map((unit, index) =>
                unit ? (
                  <SlotCard
                    key={`player-${index}`}
                    unit={unit}
                    side="player"
                    phase={phase}
                    queuedAction={queuedActions[index]}
                    onPickAction={(action) => setCardAction(index, action)}
                    onRemoveDuringDeploy={() => removeFromSlot(index)}
                    animated={animatedKeys.includes(`player-slot-${index}`)}
                  />
                ) : (
                  <EmptySlot
                    key={`player-empty-${index}`}
                    side="player"
                    slotIndex={index}
                    canPlace={Boolean(selectedHandCard)}
                    active={Boolean(selectedHandCard)}
                    phase={phase}
                    onClick={() => placeSelectedToSlot(index)}
                  />
                ),
              )}
            </div>
          </div>
        </div>

        {phase === "deploy" || phase === "enemy-deploy" ? (
          <section
            style={{
              ...glassCard(),
              padding: 10,
              display: "grid",
              gap: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(10,10,13,0.9)",
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
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    opacity: 0.64,
                  }}
                >
                  Deployment
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  {phase === "deploy"
                    ? `Place cards on slots • ${playerPlacedCount}/${BOARD_SLOTS}`
                    : "Enemy is placing cards..."}
                </div>
              </div>

              <button
                type="button"
                onClick={beginEnemyDeployment}
                disabled={!playerReady || phase !== "deploy"}
                style={{
                  ...primaryButton(),
                  opacity: !playerReady || phase !== "deploy" ? 0.55 : 1,
                  cursor: !playerReady || phase !== "deploy" ? "default" : "pointer",
                }}
              >
                Start Clash
              </button>
            </div>

            <div
              style={{
                fontSize: 13,
                opacity: 0.76,
                lineHeight: 1.42,
              }}
            >
              {phase === "deploy"
                ? selectedHandCard
                  ? `Selected: ${selectedHandCard.base.name}. Tap an empty slot on the table.`
                  : "Tap a card below, then tap one of the 5 empty slots on your side of the table."
                : "Enemy cards are entering the table with staggered deployment."}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 6,
              }}
            >
              {playerHand.map((unit) => (
                <HandCard
                  key={unit.uid}
                  unit={unit}
                  selected={selectedHandUid === unit.uid}
                  onClick={() =>
                    setSelectedHandUid((prev) => (prev === unit.uid ? null : unit.uid))
                  }
                />
              ))}
            </div>
          </section>
        ) : (
          <section
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            <div
              style={{
                ...glassCard(),
                padding: 10,
                display: "grid",
                gap: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(10,10,13,0.9)",
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
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    opacity: 0.64,
                  }}
                >
                  Battle Feed
                </div>

                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.74,
                  }}
                >
                  Default action = Strike
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 6,
                  fontSize: 13,
                  lineHeight: 1.42,
                  opacity: 0.88,
                }}
              >
                {battleLog.map((line, index) => (
                  <div key={`${line}-${index}`}>{line}</div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  ...glassCard(),
                  padding: 10,
                  display: "grid",
                  gap: 6,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(10,10,13,0.9)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    opacity: 0.64,
                  }}
                >
                  Queued Actions
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {playerBoard.map((unit, index) => {
                    if (!unit) return null;
                    return (
                      <div
                        key={`queue-${index}`}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontSize: 11,
                          fontWeight: 800,
                          opacity: unit.knocked ? 0.42 : 1,
                        }}
                      >
                        {shortName(unit.base.name)} • {fullActionLabel(queuedActions[index] ?? "strike")}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={endTurn}
                disabled={winner !== null || phase !== "battle" || !isHydrated}
                style={{
                  ...primaryButton(),
                  minWidth: 132,
                  minHeight: 54,
                  fontSize: 16,
                  opacity: winner !== null || phase !== "battle" || !isHydrated ? 0.55 : 1,
                  cursor:
                    winner !== null || phase !== "battle" || !isHydrated
                      ? "default"
                      : "pointer",
                }}
              >
                {winner === "player"
                  ? "Victory"
                  : winner === "enemy"
                    ? "Defeat"
                    : "End Turn"}
              </button>
            </div>
          </section>
        )}
      </section>

      <style jsx global>{`
        @keyframes arena-slot-drop {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </PageShell>
  );
}