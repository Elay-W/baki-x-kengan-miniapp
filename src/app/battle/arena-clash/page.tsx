"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { cards } from "@/data/cards";
import {
  getArenaClashSkill,
  getArenaClashSupport,
} from "@/lib/arenaClashSkillRegistry";
import {
  buildArenaClashMatchState,
  canBurstThisRound,
  canUseSignatureSkill,
  canUseSupport,
  canUseSwitch,
  cloneMatchState,
  findFirstEmptyPreferredSlot,
  getLivingActiveUnits,
  getUnitAtSlot,
  moveActiveUnitToReserve,
  moveReserveUnitToSlot,
} from "@/lib/arenaClashEngine";
import { resolveArenaClashRound, startArenaClashBattle } from "@/lib/arenaClashResolver";
import { loadArenaClashSetup } from "@/lib/arenaClashSetupStorage";
import {
  clearAllArenaClashStorage,
  loadArenaClashState,
  saveArenaClashResult,
  saveArenaClashState,
} from "@/lib/arenaClashStorage";
import {
  ACTIVE_BOARD_SLOTS,
  ARENA_CLASH_CONFIG,
} from "@/lib/arenaClashTypes";
import type {
  ActiveBoardSlotId,
  ArenaClashActionType,
  ArenaClashMatchState,
  ArenaClashQueuedCommand,
  ArenaClashRuntimeUnit,
} from "@/lib/arenaClashTypes";

const surface = {
  background:
    "linear-gradient(180deg, rgba(16,16,20,0.98) 0%, rgba(9,9,12,0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

function pickEnemyDeckIds(playerDeckIds: number[]) {
  const playerSet = new Set(playerDeckIds);
  const pool = cards.filter((card) => !playerSet.has(card.id));
  const picked = pool.slice(0, ARENA_CLASH_CONFIG.deckSize).map((card) => card.id);

  if (picked.length < ARENA_CLASH_CONFIG.deckSize) {
    const fallback = cards
      .filter((card) => !picked.includes(card.id))
      .slice(0, ARENA_CLASH_CONFIG.deckSize - picked.length)
      .map((card) => card.id);

    return [...picked, ...fallback];
  }

  return picked;
}

function buildSupportLoadoutFromSetup(setup: ReturnType<typeof loadArenaClashSetup>) {
  const supportIds = [...(setup?.supportIds ?? [])];

  if (setup?.godLikeSupportId && !supportIds.includes(setup.godLikeSupportId)) {
    supportIds.unshift(setup.godLikeSupportId);
  }

  return supportIds.slice(0, ARENA_CLASH_CONFIG.supportEquippedLimit);
}

function createFreshArenaMatch(): ArenaClashMatchState {
  const setup = loadArenaClashSetup();

  const playerDeckIds =
    setup?.fighterDeckIds?.length
      ? setup.fighterDeckIds.slice(0, ARENA_CLASH_CONFIG.deckSize)
      : cards.slice(0, ARENA_CLASH_CONFIG.deckSize).map((card) => card.id);

  const enemyDeckIds =
    setup?.enemyDeckIds?.length
      ? setup.enemyDeckIds.slice(0, ARENA_CLASH_CONFIG.deckSize)
      : pickEnemyDeckIds(playerDeckIds);

  const playerSupportIds = buildSupportLoadoutFromSetup(setup);

  return buildArenaClashMatchState({
    playerDeckIds,
    enemyDeckIds,
    playerSupportIds,
    enemySupportIds: [],
  });
}

function countPlayerInitialDeploy(state: ArenaClashMatchState) {
  return ACTIVE_BOARD_SLOTS.filter((slot) => Boolean(state.player.active[slot.id])).length;
}

function countPlayerFrontDeploy(state: ArenaClashMatchState) {
  return ACTIVE_BOARD_SLOTS.filter(
    (slot) => slot.row === "front" && Boolean(state.player.active[slot.id]),
  ).length;
}

function isPlayerDeployValid(state: ArenaClashMatchState) {
  return (
    countPlayerInitialDeploy(state) >= ARENA_CLASH_CONFIG.initialDeployCount &&
    countPlayerFrontDeploy(state) >= ARENA_CLASH_CONFIG.minFrontlineOnInitialDeploy
  );
}

function shortName(name: string) {
  return name.length > 14 ? `${name.slice(0, 14)}…` : name;
}

function actionColor(action: ArenaClashActionType) {
  switch (action) {
    case "Strike":
      return "#ff7b63";
    case "Charge":
      return "#ffbe68";
    case "Guard":
      return "#62cbff";
    case "Burst":
      return "#d27cff";
    case "Switch":
      return "#6affcf";
    case "Skill":
      return "#ffd76f";
    default:
      return "#ffffff";
  }
}

function Meter({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 11,
          fontWeight: 800,
          opacity: 0.82,
        }}
      >
        <span>{label}</span>
        <span>
          {Math.round(value)}
          {label === "BREAK" ? "%" : ""}
        </span>
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function UnitCard({
  unit,
  selected,
  onClick,
}: {
  unit: ArenaClashRuntimeUnit;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...surface,
        padding: 10,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        border: selected
          ? "1px solid rgba(255,194,94,0.55)"
          : "1px solid rgba(255,255,255,0.08)",
        background: selected
          ? "linear-gradient(180deg, rgba(52,32,12,0.96) 0%, rgba(13,13,16,0.98) 100%)"
          : "linear-gradient(180deg, rgba(18,18,22,0.96) 0%, rgba(11,11,14,0.98) 100%)",
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.05 }}>
              {shortName(unit.cardName)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
              {unit.cardTitle}
            </div>
          </div>

          <div
            style={{
              minWidth: 42,
              height: 30,
              padding: "0 8px",
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {unit.stars}★
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.82 }}>
          {unit.rarity} • {unit.roleTags.join(" • ")}
        </div>

        <Meter label="FORCE" value={unit.force} max={unit.forceCap} color="#ff9d50" />
        <Meter label="TEMPO" value={unit.tempo} max={unit.tempoCap} color="#4fc4ff" />
        <Meter label="BREAK" value={unit.breakMeter} max={100} color="#ff5f63" />

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 12,
            opacity: 0.85,
          }}
        >
          <span>BT: {unit.breakTokens}</span>
          <span>{unit.slotId ?? "RESERVE"}</span>
          {unit.staggerRoundsLeft > 0 && <span>STAGGER {unit.staggerRoundsLeft}</span>}
          {unit.recoveryLockRounds > 0 && <span>LOCK {unit.recoveryLockRounds}</span>}
        </div>
      </div>
    </button>
  );
}

export default function ArenaClashPage() {
  const router = useRouter();

  const [matchState, setMatchState] = useState<ArenaClashMatchState | null>(null);
  const [selectedDeployReserveUid, setSelectedDeployReserveUid] = useState<string | null>(null);
  const [selectedSwitchReserveByUnit, setSelectedSwitchReserveByUnit] = useState<Record<string, string>>({});
  const [selectedSupportId, setSelectedSupportId] = useState<string | null>(null);
  const [draftCommands, setDraftCommands] = useState<Record<string, DraftCommand>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadArenaClashState();
    const initial = stored?.state ?? createFreshArenaMatch();

    setMatchState(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!matchState) return;
    saveArenaClashState(matchState);
  }, [matchState]);

  const playerUnits = useMemo(
    () => (matchState ? getLivingActiveUnits(matchState.player) : []),
    [matchState],
  );

  const playerSupports = useMemo(
    () => matchState?.player.supportLoadout ?? [],
    [matchState],
  );

  function applyState(next: ArenaClashMatchState) {
    setMatchState(next);

    if (next.phase === "finished") {
      saveArenaClashResult(next);
    }
  }

  function resetDrafts() {
    setDraftCommands({});
    setSelectedSupportId(null);
    setSelectedSwitchReserveByUnit({});
  }

  function startFreshMatch() {
    clearAllArenaClashStorage();
    const fresh = createFreshArenaMatch();
    setSelectedDeployReserveUid(null);
    resetDrafts();
    applyState(fresh);
  }

  function handleDeployToSlot(slotId: ActiveBoardSlotId) {
    if (!matchState || matchState.phase !== "deploy" || !selectedDeployReserveUid) return;
    if (countPlayerInitialDeploy(matchState) >= ARENA_CLASH_CONFIG.initialDeployCount) return;

    const next = cloneMatchState(matchState);
    const moved = moveReserveUnitToSlot({
      team: next.player,
      reserveUid: selectedDeployReserveUid,
      slotId,
    });

    if (!moved) return;

    setSelectedDeployReserveUid(null);
    applyState(next);
  }

  function handleRemoveFromDeploy(slotId: ActiveBoardSlotId) {
    if (!matchState || matchState.phase !== "deploy") return;

    const next = cloneMatchState(matchState);
    const removed = moveActiveUnitToReserve({
      team: next.player,
      slotId,
    });

    if (!removed) return;

    applyState(next);
  }

  function handleAutoFillDeploy() {
    if (!matchState || matchState.phase !== "deploy") return;

    const next = cloneMatchState(matchState);

    while (
      countPlayerInitialDeploy(next) < ARENA_CLASH_CONFIG.initialDeployCount &&
      next.player.reserve.length > 0
    ) {
      const reserveUnit = next.player.reserve[0];
      const targetSlotId = findFirstEmptyPreferredSlot(
        next.player,
        reserveUnit.preferredRows,
      );

      if (!targetSlotId) break;

      moveReserveUnitToSlot({
        team: next.player,
        reserveUid: reserveUnit.uid,
        slotId: targetSlotId,
      });
    }

    applyState(next);
  }

  function handleStartBattle() {
    if (!matchState) return;
    if (!isPlayerDeployValid(matchState)) return;

    const next = startArenaClashBattle(matchState);
    resetDrafts();
    applyState(next);
  }

  function setUnitAction(
    unitUid: string,
    action: ArenaClashActionType,
    useSignature = false,
  ) {
    setDraftCommands((prev) => ({
      ...prev,
      [unitUid]: {
        ...prev[unitUid],
        action,
        useSignature,
      },
    }));
  }

  function setSwitchReserve(unitUid: string, reserveUid: string) {
    setSelectedSwitchReserveByUnit((prev) => ({
      ...prev,
      [unitUid]: reserveUid,
    }));
  }

  function buildPlayerCommands(state: ArenaClashMatchState): ArenaClashQueuedCommand[] {
    const commands: ArenaClashQueuedCommand[] = [];
    const livingUnits = getLivingActiveUnits(state.player);

    for (const unit of livingUnits) {
      const skill = getArenaClashSkill(unit.signatureSkillKey);
      const draft = draftCommands[unit.uid];
      const useSignature =
        Boolean(draft?.useSignature) &&
        skill &&
        canUseSignatureSkill({
          unit,
          currentRow: unit.slotId ? (unit.slotId.startsWith("front_") ? "front" : "core") : "reserve",
          phase: state.phase,
          teamSignaturesUsedThisRound: state.player.signaturesUsedThisRound,
        });

      let action: ArenaClashActionType = draft?.action ?? "Strike";

      if (useSignature && skill) {
        if (
          skill.type === "Strike" ||
          skill.type === "Charge" ||
          skill.type === "Guard" ||
          skill.type === "Burst" ||
          skill.type === "Switch"
        ) {
          action = skill.type;
        } else {
          action = "Skill";
        }
      }

      const command: ArenaClashQueuedCommand = {
        unitUid: unit.uid,
        action,
        useSignature: Boolean(useSignature),
      };

      if (action === "Switch") {
        const reserveUid = selectedSwitchReserveByUnit[unit.uid];
        if (reserveUid) {
          command.chosenReserveUid = reserveUid;
        }
      }

      commands.push(command);
    }

    if (selectedSupportId && commands.length > 0) {
      commands[0] = {
        ...commands[0],
        chosenSupportId: selectedSupportId,
      };
    }

    return commands;
  }

  function handleResolveRound() {
    if (!matchState) return;
    if (matchState.phase === "finished") return;
    if (matchState.phase !== "command") return;

    const next = cloneMatchState(matchState);
    next.queuedPlayerCommands = buildPlayerCommands(next);

    const resolved = resolveArenaClashRound(next);
    resetDrafts();
    applyState(resolved);
  }

  if (!hydrated || !matchState) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050507",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
        }}
      >
        Loading Arena Clash...
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(35,22,15,0.45) 0%, rgba(7,7,9,1) 40%, rgba(4,4,6,1) 100%)",
        color: "#fff",
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <section
          style={{
            ...surface,
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              Arena Crash
            </div>

            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
              Round {matchState.roundNumber}
            </div>

            <div style={{ fontSize: 14, opacity: 0.8 }}>
              Phase: {matchState.phase}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => router.push("/battle")}
              style={buttonSecondary}
            >
              Back
            </button>

            <button
              type="button"
              onClick={startFreshMatch}
              style={buttonSecondary}
            >
              New Match
            </button>

            {matchState.phase === "deploy" ? (
              <>
                <button
                  type="button"
                  onClick={handleAutoFillDeploy}
                  style={buttonSecondary}
                >
                  Auto Fill
                </button>
                <button
                  type="button"
                  disabled={!isPlayerDeployValid(matchState)}
                  onClick={handleStartBattle}
                  style={{
                    ...buttonPrimary,
                    opacity: isPlayerDeployValid(matchState) ? 1 : 0.5,
                  }}
                >
                  Start Clash
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={matchState.phase !== "command"}
                onClick={handleResolveRound}
                style={{
                  ...buttonPrimary,
                  opacity: matchState.phase === "command" ? 1 : 0.5,
                }}
              >
                End Turn
              </button>
            )}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) minmax(320px, 0.9fr)",
            gap: 16,
          }}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <section style={{ ...surface, padding: 16, display: "grid", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={eyebrow}>Enemy Board</div>
                  <div style={headline}>Top Side</div>
                </div>
                <div style={resourcePill}>
                  Stored Force: {matchState.enemy.storedForce}
                </div>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={rowLabel}>Frontline</div>
                  <div style={boardGrid}>
                    {ACTIVE_BOARD_SLOTS.filter((slot) => slot.row === "front").map((slot) => {
                      const unit = getUnitAtSlot(matchState.enemy, slot.id);
                      return unit ? (
                        <UnitCard key={slot.id} unit={unit} />
                      ) : (
                        <EmptySlot key={slot.id} label={slot.id} />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={rowLabel}>Core</div>
                  <div style={boardGrid}>
                    {ACTIVE_BOARD_SLOTS.filter((slot) => slot.row === "core").map((slot) => {
                      const unit = getUnitAtSlot(matchState.enemy, slot.id);
                      return unit ? (
                        <UnitCard key={slot.id} unit={unit} />
                      ) : (
                        <EmptySlot key={slot.id} label={slot.id} />
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ ...surface, padding: 16, display: "grid", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={eyebrow}>Your Board</div>
                  <div style={headline}>Bottom Side</div>
                </div>
                <div style={resourcePill}>
                  Stored Force: {matchState.player.storedForce}
                </div>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={rowLabel}>Frontline</div>
                  <div style={boardGrid}>
                    {ACTIVE_BOARD_SLOTS.filter((slot) => slot.row === "front").map((slot) => {
                      const unit = getUnitAtSlot(matchState.player, slot.id);

                      return unit ? (
                        <UnitCard
                          key={slot.id}
                          unit={unit}
                          onClick={
                            matchState.phase === "deploy"
                              ? () => handleRemoveFromDeploy(slot.id)
                              : undefined
                          }
                        />
                      ) : (
                        <EmptySlot
                          key={slot.id}
                          label={slot.id}
                          highlighted={Boolean(selectedDeployReserveUid && matchState.phase === "deploy")}
                          onClick={
                            matchState.phase === "deploy"
                              ? () => handleDeployToSlot(slot.id)
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={rowLabel}>Core</div>
                  <div style={boardGrid}>
                    {ACTIVE_BOARD_SLOTS.filter((slot) => slot.row === "core").map((slot) => {
                      const unit = getUnitAtSlot(matchState.player, slot.id);

                      return unit ? (
                        <UnitCard
                          key={slot.id}
                          unit={unit}
                          onClick={
                            matchState.phase === "deploy"
                              ? () => handleRemoveFromDeploy(slot.id)
                              : undefined
                          }
                        />
                      ) : (
                        <EmptySlot
                          key={slot.id}
                          label={slot.id}
                          highlighted={Boolean(selectedDeployReserveUid && matchState.phase === "deploy")}
                          onClick={
                            matchState.phase === "deploy"
                              ? () => handleDeployToSlot(slot.id)
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ ...surface, padding: 16, display: "grid", gap: 12 }}>
              <div style={eyebrow}>Reserve</div>
              <div style={{ fontSize: 14, opacity: 0.78 }}>
                {matchState.phase === "deploy"
                  ? "Choose reserve fighters, then tap an empty slot on your board."
                  : "Reserve fighters can be used for Switch during command phase."}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {matchState.player.reserve.map((unit) => (
                  <UnitCard
                    key={unit.uid}
                    unit={unit}
                    selected={selectedDeployReserveUid === unit.uid}
                    onClick={
                      matchState.phase === "deploy"
                        ? () =>
                            setSelectedDeployReserveUid((prev) =>
                              prev === unit.uid ? null : unit.uid,
                            )
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          </div>

          <aside style={{ display: "grid", gap: 16 }}>
            <section style={{ ...surface, padding: 16, display: "grid", gap: 12 }}>
              <div style={eyebrow}>Command Panel</div>
              <div style={headline}>Your Actions</div>

              {matchState.phase === "command" ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {playerUnits.map((unit) => {
                    const draft = draftCommands[unit.uid];
                    const chosenAction = draft?.action ?? "Strike";
                    const skill = getArenaClashSkill(unit.signatureSkillKey);
                    const currentRow = unit.slotId?.startsWith("front_") ? "front" : "core";

                    const skillReady =
                      skill &&
                      canUseSignatureSkill({
                        unit,
                        currentRow,
                        phase: matchState.phase,
                        teamSignaturesUsedThisRound:
                          matchState.player.signaturesUsedThisRound,
                      });

                    const switchReady = canUseSwitch({
                      team: matchState.player,
                      unit,
                    });

                    const reserveChoice = selectedSwitchReserveByUnit[unit.uid] ?? "";

                    return (
                      <div
                        key={unit.uid}
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 16,
                          padding: 12,
                          display: "grid",
                          gap: 10,
                          background: "rgba(255,255,255,0.03)",
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
                            <div style={{ fontSize: 16, fontWeight: 900 }}>
                              {unit.cardName}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.72 }}>
                              {unit.slotId}
                            </div>
                          </div>

                          {skill ? (
                            <div
                              style={{
                                padding: "6px 10px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              {skill.shortLabel} • {skill.tempoCost}T
                            </div>
                          ) : null}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, minmax(0,1fr))",
                            gap: 8,
                          }}
                        >
                          {(["Strike", "Charge", "Guard", "Burst", "Switch"] as ArenaClashActionType[]).map(
                            (action) => (
                              <button
                                key={action}
                                type="button"
                                onClick={() => setUnitAction(unit.uid, action, false)}
                                style={{
                                  ...commandButton,
                                  border:
                                    chosenAction === action && !draft?.useSignature
                                      ? `1px solid ${actionColor(action)}`
                                      : "1px solid rgba(255,255,255,0.08)",
                                  color:
                                    chosenAction === action && !draft?.useSignature
                                      ? actionColor(action)
                                      : "#fff",
                                  opacity:
                                    action === "Burst" && !canBurstThisRound(unit)
                                      ? 0.45
                                      : action === "Switch" && !switchReady
                                        ? 0.45
                                        : 1,
                                }}
                                disabled={
                                  (action === "Burst" && !canBurstThisRound(unit)) ||
                                  (action === "Switch" && !switchReady)
                                }
                              >
                                {action}
                              </button>
                            ),
                          )}
                        </div>

                        {skill ? (
                          <button
                            type="button"
                            onClick={() =>
                              setUnitAction(
                                unit.uid,
                                (skill.type === "Strike" ||
                                  skill.type === "Charge" ||
                                  skill.type === "Guard" ||
                                  skill.type === "Burst" ||
                                  skill.type === "Switch"
                                  ? skill.type
                                  : "Skill") as ArenaClashActionType,
                                true,
                              )
                            }
                            disabled={!skillReady}
                            style={{
                              ...commandButton,
                              border:
                                draft?.useSignature
                                  ? "1px solid #ffd76f"
                                  : "1px solid rgba(255,255,255,0.08)",
                              color: draft?.useSignature ? "#ffd76f" : "#fff",
                              opacity: skillReady ? 1 : 0.45,
                            }}
                          >
                            {skill.popupText} • Skill
                          </button>
                        ) : null}

                        {chosenAction === "Switch" ? (
                          <select
                            value={reserveChoice}
                            onChange={(e) => setSwitchReserve(unit.uid, e.target.value)}
                            style={selectStyle}
                          >
                            <option value="">Choose reserve fighter</option>
                            {matchState.player.reserve.map((reserveUnit) => (
                              <option key={reserveUnit.uid} value={reserveUnit.uid}>
                                {reserveUnit.cardName}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 14, opacity: 0.78 }}>
                  Commands become available when the battle enters the command phase.
                </div>
              )}
            </section>

            <section style={{ ...surface, padding: 16, display: "grid", gap: 12 }}>
              <div style={eyebrow}>Support</div>
              <div style={headline}>Team Support Loadout</div>

              {playerSupports.length > 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {playerSupports.map((support) => {
                    const selectable = canUseSupport({
                      team: matchState.player,
                      support,
                      currentRound: matchState.roundNumber,
                    });

                    return (
                      <button
                        key={support.id}
                        type="button"
                        disabled={matchState.phase !== "command" || !selectable}
                        onClick={() =>
                          setSelectedSupportId((prev) =>
                            prev === support.id ? null : support.id,
                          )
                        }
                        style={{
                          ...commandButton,
                          textAlign: "left",
                          border:
                            selectedSupportId === support.id
                              ? "1px solid #ffd76f"
                              : "1px solid rgba(255,255,255,0.08)",
                          opacity:
                            matchState.phase === "command" && selectable ? 1 : 0.45,
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>{support.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                          {support.popupText} • Cost {support.storedForceCost}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 14, opacity: 0.75 }}>
                  No supports equipped.
                </div>
              )}
            </section>

            <section style={{ ...surface, padding: 16, display: "grid", gap: 12 }}>
              <div style={eyebrow}>Battle Feed</div>
              <div style={{ display: "grid", gap: 8, maxHeight: 320, overflow: "auto" }}>
                {matchState.battleLog.slice().reverse().map((line, index) => (
                  <div
                    key={`${line}-${index}`}
                    style={{
                      fontSize: 13,
                      lineHeight: 1.4,
                      opacity: 0.88,
                      paddingBottom: 8,
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...surface, padding: 16, display: "grid", gap: 12 }}>
              <div style={eyebrow}>Popup Queue</div>
              <div style={{ display: "grid", gap: 8, maxHeight: 240, overflow: "auto" }}>
                {matchState.popupQueue.slice().reverse().map((popup) => (
                  <div
                    key={popup.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: `1px solid ${popup.outline}`,
                      background: "rgba(255,255,255,0.03)",
                      fontWeight: 900,
                      color: popup.color,
                      fontSize: 13,
                    }}
                  >
                    {popup.text}
                    {popup.slotId ? ` • ${popup.slotId}` : ""}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

type DraftCommand = {
  action: ArenaClashActionType;
  useSignature?: boolean;
  chosenReserveUid?: string;
};

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  opacity: 0.62,
};

const headline: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  lineHeight: 1,
};

const rowLabel: React.CSSProperties = {
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.7,
};

const boardGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const resourcePill: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: 13,
  fontWeight: 900,
};

const buttonPrimary: React.CSSProperties = {
  height: 46,
  padding: "0 18px",
  borderRadius: 14,
  border: "1px solid rgba(255,203,102,0.35)",
  background: "linear-gradient(180deg, #f6f1e8 0%, #ddd5c8 100%)",
  color: "#111",
  fontWeight: 900,
  cursor: "pointer",
};

const buttonSecondary: React.CSSProperties = {
  height: 46,
  padding: "0 18px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const commandButton: React.CSSProperties = {
  minHeight: 42,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const selectStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
};

function EmptySlot({
  label,
  highlighted,
  onClick,
}: {
  label: string;
  highlighted?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...surface,
        minHeight: 220,
        cursor: onClick ? "pointer" : "default",
        display: "grid",
        placeItems: "center",
        border: highlighted
          ? "1px dashed rgba(255,194,94,0.55)"
          : "1px dashed rgba(255,255,255,0.12)",
        background: highlighted
          ? "linear-gradient(180deg, rgba(62,38,14,0.72) 0%, rgba(12,12,15,0.96) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(12,12,15,0.96) 100%)",
      }}
    >
      <div style={{ display: "grid", gap: 8, textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 900, opacity: 0.72 }}>EMPTY</div>
        <div style={{ fontSize: 12, opacity: 0.55 }}>{label}</div>
      </div>
    </button>
  );
}
