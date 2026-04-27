import {
  getArenaClashSkill,
  getArenaClashSupport,
} from "@/lib/arenaClashSkillRegistry";
import {
  ACTIVE_BOARD_SLOTS,
  ARENA_CLASH_CONFIG,
  ARENA_POPUPS,
} from "@/lib/arenaClashTypes";
import type {
  ActiveBoardSlotId,
  ArenaClashActionType,
  ArenaClashDeployRow,
  ArenaClashMatchState,
  ArenaClashPhase,
  ArenaClashQueuedCommand,
  ArenaClashRow,
  ArenaClashRuntimeStatusInstance,
  ArenaClashRuntimeUnit,
  ArenaClashSide,
  ArenaClashSkillDefinition,
  ArenaClashTeamState,
} from "@/lib/arenaClashTypes";
import {
  addStatus,
  applyPressureToBreakMeter,
  applyTeamStoredForceDelta,
  applyUnitForceDelta,
  applyUnitTempoDelta,
  canBurstThisRound,
  canUseSignatureSkill,
  canUseSupport,
  canUseSwitch,
  clamp,
  cloneMatchState,
  countLivingUnits,
  createArenaPopupEvent,
  createPopupFromDefinition,
  findFirstEmptyPreferredSlot,
  getBreakThreshold,
  getChargeForceGain,
  getChargeTempoGain,
  getEffectivePressure,
  getLivingActiveUnits,
  getOpponentTeam,
  getReadValue,
  getSlotMeta,
  getSwitchEntryBonuses,
  getTeam,
  getUnitAtSlot,
  getUnitsInSlotOrder,
  hasLivingCore,
  hasLivingFrontline,
  hasStatus,
  isFrontSlot,
  markSkillUsage,
  moveActiveUnitToReserve,
  moveReserveUnitToSlot,
  removeEliminatedFromReserve,
  resetTeamRoundCounters,
  round,
  setUnitLastAction,
  setUnitLastPopup,
  spendTeamStoredForce,
  tickTeamForNewRound,
} from "@/lib/arenaClashEngine";

type ResolvedCommand = {
  unit: ArenaClashRuntimeUnit;
  command: ArenaClashQueuedCommand;
  skill: ArenaClashSkillDefinition | null;
  side: ArenaClashSide;
};

function getCurrentRow(unit: ArenaClashRuntimeUnit): ArenaClashRow {
  if (unit.inReserve || !unit.slotId) return "reserve";
  return getSlotMeta(unit.slotId).row;
}

function findUnitByUid(
  team: ArenaClashTeamState,
  uid: string,
): ArenaClashRuntimeUnit | null {
  for (const unit of getUnitsInSlotOrder(team)) {
    if (unit.uid === uid) return unit;
  }

  for (const unit of team.reserve) {
    if (unit.uid === uid) return unit;
  }

  return null;
}

function getQueuedCommandForUnit(
  commands: ArenaClashQueuedCommand[],
  unitUid: string,
): ArenaClashQueuedCommand | null {
  return commands.find((command) => command.unitUid === unitUid) ?? null;
}

function getDefaultActionForUnit(unit: ArenaClashRuntimeUnit): ArenaClashActionType {
  if (unit.staggerRoundsLeft > 0) return "Guard";
  if (unit.breakMeter >= 70 && getCurrentRow(unit) === "front") return "Guard";
  if (unit.force <= 8 || unit.tempo <= 15) return "Charge";
  if (unit.tempo >= 55 && canBurstThisRound(unit)) return "Burst";
  return "Strike";
}

function createFallbackCommand(
  unit: ArenaClashRuntimeUnit,
): ArenaClashQueuedCommand {
  return {
    unitUid: unit.uid,
    action: getDefaultActionForUnit(unit),
  };
}

function getResolvedCommandsForSide(
  state: ArenaClashMatchState,
  side: ArenaClashSide,
): ResolvedCommand[] {
  const team = getTeam(state, side);
  const sourceCommands =
    side === "player" ? state.queuedPlayerCommands : state.queuedEnemyCommands;

  return getLivingActiveUnits(team).map((unit) => {
    const command = getQueuedCommandForUnit(sourceCommands, unit.uid) ?? createFallbackCommand(unit);
    const skill =
      command.useSignature || command.action === "Skill"
        ? getArenaClashSkill(unit.signatureSkillKey)
        : null;

    return {
      unit,
      command,
      skill,
      side,
    };
  });
}

function getInitiativeScore(unit: ArenaClashRuntimeUnit): number {
  return round(
    unit.stats.SPD * 0.44 +
      unit.stats.INSTINCT * 0.34 +
      unit.stats.TECH * 0.22 +
      unit.tempo * 0.35,
  );
}

function sortResolvedCommandsByInitiative(
  items: ResolvedCommand[],
): ResolvedCommand[] {
  return [...items].sort((a, b) => getInitiativeScore(b.unit) - getInitiativeScore(a.unit));
}

function countActiveUnits(team: ArenaClashTeamState): number {
  return getUnitsInSlotOrder(team).length;
}

function countFrontlineUnits(team: ArenaClashTeamState): number {
  return ACTIVE_BOARD_SLOTS.filter((slot) => slot.row === "front").filter(
    (slot) => Boolean(team.active[slot.id] && !team.active[slot.id]?.eliminated),
  ).length;
}

function getLivingEnemySlots(team: ArenaClashTeamState): ActiveBoardSlotId[] {
  return ACTIVE_BOARD_SLOTS.map((slot) => slot.id).filter((slotId) => {
    const unit = team.active[slotId];
    return Boolean(unit && !unit.eliminated);
  });
}

function getLivingEnemyFrontSlots(team: ArenaClashTeamState): ActiveBoardSlotId[] {
  return ACTIVE_BOARD_SLOTS.filter((slot) => slot.row === "front")
    .map((slot) => slot.id)
    .filter((slotId) => {
      const unit = team.active[slotId];
      return Boolean(unit && !unit.eliminated);
    });
}

function getLivingEnemyCoreSlots(team: ArenaClashTeamState): ActiveBoardSlotId[] {
  return ACTIVE_BOARD_SLOTS.filter((slot) => slot.row === "core")
    .map((slot) => slot.id)
    .filter((slotId) => {
      const unit = team.active[slotId];
      return Boolean(unit && !unit.eliminated);
    });
}

function chooseNearestSlotByLane(
  attackerSlotId: ActiveBoardSlotId,
  candidateSlots: ActiveBoardSlotId[],
): ActiveBoardSlotId | null {
  if (candidateSlots.length === 0) return null;

  const attackerLane = getSlotMeta(attackerSlotId).lane;

  return [...candidateSlots].sort((a, b) => {
    const aDist = Math.abs(getSlotMeta(a).lane - attackerLane);
    const bDist = Math.abs(getSlotMeta(b).lane - attackerLane);
    return aDist - bDist;
  })[0];
}

function resolveAttackTargetSlot(params: {
  attacker: ArenaClashRuntimeUnit;
  defenderTeam: ArenaClashTeamState;
  preferredTargetSlotId?: ActiveBoardSlotId;
  targetRule?: ArenaClashSkillDefinition["targetRule"];
}): ActiveBoardSlotId | null {
  if (!params.attacker.slotId) return null;

  const allFront = getLivingEnemyFrontSlots(params.defenderTeam);
  const allCore = getLivingEnemyCoreSlots(params.defenderTeam);
  const allLiving = getLivingEnemySlots(params.defenderTeam);

  if (allLiving.length === 0) return null;

  const targetRule = params.targetRule ?? "front-enemy";

  if (params.preferredTargetSlotId) {
    const targetUnit = params.defenderTeam.active[params.preferredTargetSlotId];
    if (
      targetUnit &&
      !targetUnit.eliminated &&
      (!hasLivingFrontline(params.defenderTeam) ||
        isFrontSlot(params.preferredTargetSlotId) ||
        targetRule === "any-enemy")
    ) {
      return params.preferredTargetSlotId;
    }
  }

  if (targetRule === "any-enemy" && allLiving.length > 0) {
    return chooseNearestSlotByLane(params.attacker.slotId, allLiving);
  }

  if (targetRule === "same-lane-enemy") {
    const attackerMeta = getSlotMeta(params.attacker.slotId);
    const sameLaneFront = allFront.find(
      (slotId) => getSlotMeta(slotId).lane === attackerMeta.lane,
    );
    if (sameLaneFront) return sameLaneFront;

    if (allFront.length > 0) return chooseNearestSlotByLane(params.attacker.slotId, allFront);

    const sameLaneCore = allCore.find(
      (slotId) => getSlotMeta(slotId).lane === attackerMeta.lane,
    );
    if (sameLaneCore) return sameLaneCore;
    return chooseNearestSlotByLane(params.attacker.slotId, allCore);
  }

  if (targetRule === "broken-enemy") {
    const brokenTargets = allLiving.filter((slotId) => {
      const unit = params.defenderTeam.active[slotId];
      return Boolean(unit && unit.breakTokens >= 1 && !unit.eliminated);
    });

    if (brokenTargets.length > 0) {
      return chooseNearestSlotByLane(params.attacker.slotId, brokenTargets);
    }
  }

  if (allFront.length > 0) {
    return chooseNearestSlotByLane(params.attacker.slotId, allFront);
  }

  if (allCore.length > 0) {
    return chooseNearestSlotByLane(params.attacker.slotId, allCore);
  }

  return chooseNearestSlotByLane(params.attacker.slotId, allLiving);
}

function getNormalForceSpend(
  unit: ArenaClashRuntimeUnit,
  action: "Strike" | "Burst",
): number {
  if (action === "Burst") return Math.min(unit.force, 16);
  return Math.min(unit.force, 8);
}

function getSkillPressureMultiplier(
  skill: ArenaClashSkillDefinition | null,
  unit: ArenaClashRuntimeUnit,
): number {
  if (!skill) return 0;

  const scalingScore = Object.entries(skill.statScaling).reduce(
    (acc, [key, value]) => {
      const statKey = key as keyof typeof unit.stats;
      return acc + unit.stats[statKey] * (value ?? 0);
    },
    0,
  );

  return clamp(round(scalingScore / 400, 3), 0, 0.35);
}

function getFlatGuardBonusFromStatuses(unit: ArenaClashRuntimeUnit): number {
  let bonus = 0;
  if (hasStatus(unit, "GuardBoost")) bonus += 10;
  if (hasStatus(unit, "DemonBack")) bonus += 4;
  return bonus;
}

function getFlatReadBonusPctFromStatuses(unit: ArenaClashRuntimeUnit): number {
  let bonus = 0;
  if (hasStatus(unit, "ReadBuff")) bonus += 0.08;
  if (hasStatus(unit, "DemonBack")) bonus += 0.1;
  return bonus;
}

function getPressureBonusPctFromStatuses(unit: ArenaClashRuntimeUnit): number {
  let bonus = 0;
  if (hasStatus(unit, "PressureBuff")) bonus += 0.12;
  if (hasStatus(unit, "DemonBack")) bonus += 0.18;
  return bonus;
}

function getBreakThresholdMultiplierFromStatuses(
  unit: ArenaClashRuntimeUnit,
): number {
  let mult = 1;
  if (hasStatus(unit, "BreakResist")) mult += 0.12;
  if (hasStatus(unit, "DemonBack")) mult += 0.1;
  return mult;
}

function addBattleLog(state: ArenaClashMatchState, text: string) {
  state.battleLog.push(text);
  if (state.battleLog.length > 40) {
    state.battleLog = state.battleLog.slice(-40);
  }
}

function pushPopup(state: ArenaClashMatchState, popup: ReturnType<typeof createArenaPopupEvent>) {
  state.popupQueue.push(popup);
  if (state.popupQueue.length > 30) {
    state.popupQueue = state.popupQueue.slice(-30);
  }
}

function removeEliminatedActiveUnits(
  state: ArenaClashMatchState,
  side: ArenaClashSide,
) {
  const team = getTeam(state, side);

  for (const slotId of Object.keys(team.active) as ActiveBoardSlotId[]) {
    const unit = team.active[slotId];
    if (!unit || !unit.eliminated) continue;

    delete team.active[slotId];

    pushPopup(
      state,
      createPopupFromDefinition(ARENA_POPUPS.state.break, {
        side,
        slotId,
        targetUnitUid: unit.uid,
      }),
    );

    addBattleLog(state, `${unit.cardName} is eliminated from ${side} ${slotId}.`);
  }

  removeEliminatedFromReserve(team);
}

function checkMatchEnd(state: ArenaClashMatchState): ArenaClashMatchState {
  const playerAlive = countLivingUnits(state.player);
  const enemyAlive = countLivingUnits(state.enemy);

  if (playerAlive <= 0 && enemyAlive <= 0) {
    state.phase = "finished";
    state.winner = null;
    state.loser = null;
    state.finishedReason = "all_eliminated";
    return state;
  }

  if (playerAlive <= 0) {
    state.phase = "finished";
    state.winner = "enemy";
    state.loser = "player";
    state.finishedReason = "all_eliminated";
    return state;
  }

  if (enemyAlive <= 0) {
    state.phase = "finished";
    state.winner = "player";
    state.loser = "enemy";
    state.finishedReason = "all_eliminated";
    return state;
  }

  if (!hasLivingCore(state.player) && state.player.reserve.length === 0) {
    state.phase = "finished";
    state.winner = "enemy";
    state.loser = "player";
    state.finishedReason = "collapse";
    return state;
  }

  if (!hasLivingCore(state.enemy) && state.enemy.reserve.length === 0) {
    state.phase = "finished";
    state.winner = "player";
    state.loser = "enemy";
    state.finishedReason = "collapse";
    return state;
  }

  return state;
}

function buildEnemyAutoCommands(
  state: ArenaClashMatchState,
): ArenaClashQueuedCommand[] {
  const enemy = state.enemy;
  const commands: ArenaClashQueuedCommand[] = [];

  for (const unit of getLivingActiveUnits(enemy)) {
    let action: ArenaClashActionType = "Strike";

    if (unit.staggerRoundsLeft > 0) {
      action = "Guard";
    } else if (unit.breakMeter >= 70 && getCurrentRow(unit) === "front") {
      action = "Guard";
    } else if (unit.tempo >= 60 && canBurstThisRound(unit)) {
      action = "Burst";
    } else if (unit.force <= 8 || unit.tempo <= 12) {
      action = "Charge";
    }

    commands.push({
      unitUid: unit.uid,
      action,
    });
  }

  return commands;
}

function getSignatureForCommand(
  unit: ArenaClashRuntimeUnit,
  command: ArenaClashQueuedCommand,
): ArenaClashSkillDefinition | null {
  if (!command.useSignature && command.action !== "Skill") return null;
  return getArenaClashSkill(unit.signatureSkillKey);
}

function maybeConsumeIgnoreFirstBreak(unit: ArenaClashRuntimeUnit): boolean {
  const demonBack = unit.statusEffects.find(
    (status) =>
      status.type === "DemonBack" &&
      typeof status.notes === "string" &&
      status.notes.includes("ignoreFirstBreak") &&
      !status.notes.includes("ignoreUsed"),
  );

  if (!demonBack) return false;

  demonBack.notes = `${demonBack.notes}|ignoreUsed`;
  return true;
}

function applyAttackResolution(params: {
  state: ArenaClashMatchState;
  attacker: ArenaClashRuntimeUnit;
  defender: ArenaClashRuntimeUnit;
  attackerSide: ArenaClashSide;
  action: "Strike" | "Burst";
  skill: ArenaClashSkillDefinition | null;
}): void {
  const { state, attacker, defender, attackerSide, action, skill } = params;
  const defenderSide: ArenaClashSide = attackerSide === "player" ? "enemy" : "player";

  const spentForce = skill?.forceCost
    ? Math.min(attacker.force, skill.forceCost)
    : getNormalForceSpend(attacker, action);

  attacker.force = Math.max(0, attacker.force - spentForce);

  const pressure = getEffectivePressure({
    attackerStats: attacker.stats,
    defenderStats: defender.stats,
    action,
    spentForce,
    targetIsGuarding:
      attackerSide === "player"
        ? hasStatus(defender, "GuardBoost") || defender.lastAction === "Guard"
        : hasStatus(defender, "GuardBoost") || defender.lastAction === "Guard",
    targetIsFrontline: defender.slotId ? isFrontSlot(defender.slotId) : false,
    flatGuardBonus: getFlatGuardBonusFromStatuses(defender),
    flatReadBonusPct:
      getFlatReadBonusPctFromStatuses(attacker) +
      getSkillPressureMultiplier(skill, attacker) +
      getPressureBonusPctFromStatuses(attacker),
  });

  const breakThreshold =
    getBreakThreshold(defender.stats) * getBreakThresholdMultiplierFromStatuses(defender);

  const result = applyPressureToBreakMeter({
    currentBreakMeter: defender.breakMeter,
    currentBreakTokens: defender.breakTokens,
    breakThreshold,
    pressure,
  });

  defender.breakMeter = result.nextBreakMeter;
  defender.breakTokens = result.nextBreakTokens;

  if (result.broke) {
    const ignored = maybeConsumeIgnoreFirstBreak(defender);

    if (ignored) {
      defender.breakTokens = Math.max(0, defender.breakTokens - 1);
      defender.breakMeter = 55;
      pushPopup(
        state,
        createPopupFromDefinition(ARENA_POPUPS.result.block, {
          side: defenderSide,
          slotId: defender.slotId,
          sourceUnitUid: attacker.uid,
          targetUnitUid: defender.uid,
        }),
      );
      addBattleLog(
        state,
        `${defender.cardName} ignores the first Break through a special body-state.`,
      );
    } else {
      defender.staggerRoundsLeft = ARENA_CLASH_CONFIG.firstBreakStaggerRounds;
      pushPopup(
        state,
        createPopupFromDefinition(ARENA_POPUPS.state.break, {
          side: defenderSide,
          slotId: defender.slotId,
          sourceUnitUid: attacker.uid,
          targetUnitUid: defender.uid,
        }),
      );
      addBattleLog(
        state,
        `${attacker.cardName} ${action.toLowerCase()} pressures ${defender.cardName} for ${result.gainPercent}% and causes Break.`,
      );
    }
  } else {
    addBattleLog(
      state,
      `${attacker.cardName} ${action.toLowerCase()} pressures ${defender.cardName} for ${result.gainPercent}%.`,
    );
    pushPopup(
      state,
      createArenaPopupEvent({
        text: `PRESSURE +${Math.round(result.gainPercent)}`,
        kind: "result",
        color: ARENA_POPUPS.result.pressure.color,
        outline: ARENA_POPUPS.result.pressure.outline,
        side: defenderSide,
        slotId: defender.slotId,
        sourceUnitUid: attacker.uid,
        targetUnitUid: defender.uid,
      }),
    );
  }

  if (result.eliminated) {
    defender.eliminated = true;
    addBattleLog(state, `${defender.cardName} can no longer continue the fight.`);
  }

  if (action === "Strike") {
    applyUnitTempoDelta(attacker, -8);
    applyUnitForceDelta(attacker, 3);
  } else {
    applyUnitTempoDelta(attacker, -20);
    applyUnitForceDelta(attacker, 5);
  }
}

function applySupportToTeam(params: {
  state: ArenaClashMatchState;
  side: ArenaClashSide;
  supportId: string;
}): boolean {
  const { state, side, supportId } = params;
  const team = getTeam(state, side);
  const support = getArenaClashSupport(supportId);

  if (!support) return false;
  if (!team.supportLoadout.some((item) => item.id === support.id)) return false;
  if (!canUseSupport({ team, support, currentRound: state.roundNumber })) return false;
  if (!spendTeamStoredForce(team, support.storedForceCost)) return false;

  team.supportsUsedThisRound += 1;

  for (const unit of getLivingActiveUnits(team)) {
    if (support.baseModifiers?.guardValuePct || support.id === "indestructible_stance") {
      addStatus(unit, {
        id: `guard_boost_${support.id}_${unit.uid}`,
        type: "GuardBoost",
        remainingRounds: support.durationRounds ?? 1,
        sourceId: support.id,
      });
    }

    if (support.baseModifiers?.readValueFlat || support.id === "fist_eye_analysis") {
      addStatus(unit, {
        id: `read_buff_${support.id}_${unit.uid}`,
        type: "ReadBuff",
        remainingRounds: support.durationRounds ?? 1,
        sourceId: support.id,
      });
    }

    if (support.baseModifiers?.strikePressurePct || support.baseModifiers?.burstPressurePct) {
      addStatus(unit, {
        id: `pressure_buff_${support.id}_${unit.uid}`,
        type: support.id === "demon_back" ? "DemonBack" : "PressureBuff",
        remainingRounds: support.durationRounds ?? 1,
        sourceId: support.id,
        notes:
          support.id === "demon_back" && unit.cardSlug === "yujiro-hanma"
            ? "ignoreFirstBreak"
            : undefined,
      });
    }

    if (support.baseModifiers?.breakThresholdPct || support.id === "indestructible_stance") {
      addStatus(unit, {
        id: `break_resist_${support.id}_${unit.uid}`,
        type: "BreakResist",
        remainingRounds: support.durationRounds ?? 1,
        sourceId: support.id,
      });
    }

    if (support.baseModifiers?.chargeGainPct || support.id === "adrenal_override") {
      addStatus(unit, {
        id: `force_buff_${support.id}_${unit.uid}`,
        type: "ForceBuff",
        remainingRounds: support.durationRounds ?? 1,
        sourceId: support.id,
      });
      applyUnitForceDelta(unit, 8);
      applyUnitTempoDelta(unit, 8);
    }

    if (support.id === "demon_back" && unit.cardSlug === "yujiro-hanma") {
      applyUnitForceDelta(unit, 12);
      applyUnitTempoDelta(unit, 14);
    }
  }

  const popup =
    support.id === "demon_back"
      ? ARENA_POPUPS.special.demonBack
      : ARENA_POPUPS.special.godLike;

  pushPopup(
    state,
    createPopupFromDefinition(popup, {
      side,
      slotId: null,
    }),
  );

  addBattleLog(state, `${side} activates support: ${support.name}.`);
  return true;
}

function resolveGuardOrChargeAction(params: {
  state: ArenaClashMatchState;
  resolved: ResolvedCommand;
}) {
  const { state, resolved } = params;
  const unit = resolved.unit;
  const action = resolved.command.action;
  const row = getCurrentRow(unit);
  const skill = getSignatureForCommand(unit, resolved.command);

  if (unit.eliminated || unit.staggerRoundsLeft > 0) return;
  if (row === "reserve") return;

  if (skill) {
    if (
      !canUseSignatureSkill({
        unit,
        currentRow: row,
        phase: state.phase,
        teamSignaturesUsedThisRound: getTeam(state, resolved.side).signaturesUsedThisRound,
      })
    ) {
      return;
    }
  }

  if (action === "Guard" || (skill && skill.type === "Guard")) {
    setUnitLastAction(unit, "Guard");
    setUnitLastPopup(unit, ARENA_POPUPS.action.guard);

    addStatus(unit, {
      id: `guard_${unit.uid}_${state.roundNumber}`,
      type: "GuardBoost",
      remainingRounds: 1,
      sourceId: skill?.key,
    });

    addStatus(unit, {
      id: `read_${unit.uid}_${state.roundNumber}`,
      type: "ReadBuff",
      remainingRounds: skill ? 1 : 0,
      sourceId: skill?.key,
    });

    applyUnitTempoDelta(unit, skill ? 10 : 6);

    if (skill) {
      markSkillUsage(unit, skill);
      getTeam(state, resolved.side).signaturesUsedThisRound += 1;
      pushPopup(
        state,
        createArenaPopupEvent({
          text: skill.popupText,
          kind: "special",
          color: ARENA_POPUPS.action.skill.color,
          outline: ARENA_POPUPS.action.skill.outline,
          side: resolved.side,
          slotId: unit.slotId,
          sourceUnitUid: unit.uid,
        }),
      );
    } else {
      pushPopup(
        state,
        createPopupFromDefinition(ARENA_POPUPS.action.guard, {
          side: resolved.side,
          slotId: unit.slotId,
          sourceUnitUid: unit.uid,
        }),
      );
    }

    addBattleLog(state, `${unit.cardName} takes Guard.`);
    return;
  }

  if (action === "Charge" || (skill && skill.type === "Charge")) {
    setUnitLastAction(unit, "Charge");
    setUnitLastPopup(unit, ARENA_POPUPS.action.charge);

    let forceGain = getChargeForceGain(unit.stats);
    let tempoGain = getChargeTempoGain(unit.stats);

    if (hasStatus(unit, "ForceBuff")) forceGain = round(forceGain * 1.12);
    if (skill) {
      forceGain = round(forceGain * (1 + getSkillPressureMultiplier(skill, unit)));
      tempoGain = round(tempoGain * 1.18);
      markSkillUsage(unit, skill);
      getTeam(state, resolved.side).signaturesUsedThisRound += 1;
      pushPopup(
        state,
        createArenaPopupEvent({
          text: skill.popupText,
          kind: "special",
          color: ARENA_POPUPS.action.skill.color,
          outline: ARENA_POPUPS.action.skill.outline,
          side: resolved.side,
          slotId: unit.slotId,
          sourceUnitUid: unit.uid,
        }),
      );
    } else {
      pushPopup(
        state,
        createPopupFromDefinition(ARENA_POPUPS.action.charge, {
          side: resolved.side,
          slotId: unit.slotId,
          sourceUnitUid: unit.uid,
        }),
      );
    }

    applyUnitForceDelta(unit, forceGain);
    applyUnitTempoDelta(unit, tempoGain);

    addBattleLog(
      state,
      `${unit.cardName} charges up (+${Math.round(forceGain)} Force, +${Math.round(
        tempoGain,
      )} Tempo).`,
    );
  }
}

function resolveAttackPhaseForAction(params: {
  state: ArenaClashMatchState;
  action: "Strike" | "Burst";
}) {
  const { state, action } = params;

  const allResolved = sortResolvedCommandsByInitiative([
    ...getResolvedCommandsForSide(state, "player"),
    ...getResolvedCommandsForSide(state, "enemy"),
  ]);

  for (const resolved of allResolved) {
    const unit = resolved.unit;
    const currentTeam = getTeam(state, resolved.side);
    const unitOnBoard = unit.slotId ? currentTeam.active[unit.slotId] : null;
    if (!unitOnBoard || unitOnBoard.uid !== unit.uid) continue;
    if (unitOnBoard.eliminated || unitOnBoard.staggerRoundsLeft > 0) continue;

    const skill = getSignatureForCommand(unitOnBoard, resolved.command);
    const effectiveAction: ArenaClashActionType =
      skill?.type && ["Strike", "Burst"].includes(skill.type)
        ? (skill.type as ArenaClashActionType)
        : resolved.command.action;

    if (effectiveAction !== action) continue;
    if (action === "Burst" && !canBurstThisRound(unitOnBoard)) continue;

    const targetTeam = getOpponentTeam(state, resolved.side);
    const targetSlot = resolveAttackTargetSlot({
      attacker: unitOnBoard,
      defenderTeam: targetTeam,
      preferredTargetSlotId: resolved.command.targetSlotId,
      targetRule: skill?.targetRule,
    });

    if (!targetSlot) continue;

    const defender = getUnitAtSlot(targetTeam, targetSlot);
    if (!defender || defender.eliminated) continue;

    setUnitLastAction(unitOnBoard, action);
    setUnitLastPopup(
      unitOnBoard,
      action === "Strike" ? ARENA_POPUPS.action.strike : ARENA_POPUPS.action.burst,
    );

    if (skill) {
      if (
        !canUseSignatureSkill({
          unit: unitOnBoard,
          currentRow: getCurrentRow(unitOnBoard),
          phase: state.phase,
          teamSignaturesUsedThisRound: currentTeam.signaturesUsedThisRound,
        })
      ) {
        continue;
      }

      markSkillUsage(unitOnBoard, skill);
      currentTeam.signaturesUsedThisRound += 1;
      pushPopup(
        state,
        createArenaPopupEvent({
          text: skill.popupText,
          kind: "special",
          color: ARENA_POPUPS.action.skill.color,
          outline: ARENA_POPUPS.action.skill.outline,
          side: resolved.side,
          slotId: unitOnBoard.slotId,
          sourceUnitUid: unitOnBoard.uid,
          targetUnitUid: defender.uid,
        }),
      );
    } else {
      pushPopup(
        state,
        createPopupFromDefinition(
          action === "Strike" ? ARENA_POPUPS.action.strike : ARENA_POPUPS.action.burst,
          {
            side: resolved.side,
            slotId: unitOnBoard.slotId,
            sourceUnitUid: unitOnBoard.uid,
            targetUnitUid: defender.uid,
          },
        ),
      );
    }

    applyAttackResolution({
      state,
      attacker: unitOnBoard,
      defender,
      attackerSide: resolved.side,
      action,
      skill,
    });
  }
}

export function isInitialDeploymentValid(team: ArenaClashTeamState): boolean {
  const activeCount = countActiveUnits(team);
  const frontlineCount = countFrontlineUnits(team);

  return (
    activeCount >= ARENA_CLASH_CONFIG.initialDeployCount &&
    frontlineCount >= ARENA_CLASH_CONFIG.minFrontlineOnInitialDeploy
  );
}

export function autoDeployTeam(team: ArenaClashTeamState, desiredCount = ARENA_CLASH_CONFIG.initialDeployCount) {
  while (
    countActiveUnits(team) < desiredCount &&
    team.reserve.length > 0
  ) {
    const nextReserve = team.reserve[0];
    const targetSlotId = findFirstEmptyPreferredSlot(team, nextReserve.preferredRows);

    if (!targetSlotId) break;

    moveReserveUnitToSlot({
      team,
      reserveUid: nextReserve.uid,
      slotId: targetSlotId,
    });
  }
}

export function startArenaClashBattle(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);

  if (!isInitialDeploymentValid(next.player)) {
    addBattleLog(next, "Player deployment is not valid yet.");
    return next;
  }

  autoDeployTeam(next.enemy, ARENA_CLASH_CONFIG.initialDeployCount);

  next.phase = "command";
  next.battleLog = [
    ...next.battleLog,
    "Enemy deployment complete.",
    "Arena Crash begins. Choose commands.",
  ];

  return next;
}

export function resolveDeployPhase(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);

  if (isInitialDeploymentValid(next.player)) {
    next.phase = "enemy-deploy";
    addBattleLog(next, "Player deployment locked. Enemy deployment begins.");
  }

  return next;
}

export function resolveEnemyDeployPhase(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);
  autoDeployTeam(next.enemy, ARENA_CLASH_CONFIG.initialDeployCount);
  next.phase = "command";
  addBattleLog(next, "Enemy deployment complete.");
  return next;
}

export function resolveSwitchPhase(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);
  next.phase = "switch";

  for (const side of ["player", "enemy"] as ArenaClashSide[]) {
    const team = getTeam(next, side);
    const sourceCommands =
      side === "player" ? next.queuedPlayerCommands : next.queuedEnemyCommands;

    const switchCommands = sortResolvedCommandsByInitiative(
  getLivingActiveUnits(team)
    .map((unit): ResolvedCommand | null => {
      const command = sourceCommands.find(
        (item) => item.unitUid === unit.uid && item.action === "Switch",
      );

      if (!command) return null;

      return {
        unit,
        command,
        skill: null,
        side,
      };
    })
    .filter((item): item is ResolvedCommand => item !== null),
);

    for (const resolved of switchCommands) {
      const actingUnit = resolved.unit.slotId ? team.active[resolved.unit.slotId] : null;
      if (!actingUnit || actingUnit.uid !== resolved.unit.uid) continue;
      if (!canUseSwitch({ team, unit: actingUnit })) continue;
      if (!resolved.command.chosenReserveUid || !actingUnit.slotId) continue;
      if (!spendTeamStoredForce(team, ARENA_CLASH_CONFIG.switchStoredForceCost)) continue;

      const originalSlotId = actingUnit.slotId;
      const movedOut = moveActiveUnitToReserve({
        team,
        slotId: originalSlotId,
      });

      if (!movedOut) continue;

      const movedIn = moveReserveUnitToSlot({
        team,
        reserveUid: resolved.command.chosenReserveUid,
        slotId: originalSlotId,
      });

      if (!movedIn) {
        moveReserveUnitToSlot({
          team,
          reserveUid: movedOut.uid,
          slotId: originalSlotId,
        });
        continue;
      }

      const entryBonuses = getSwitchEntryBonuses(movedIn.stats);
      applyUnitTempoDelta(movedIn, entryBonuses.tempoBonus);
      applyUnitForceDelta(movedIn, 4);

      addStatus(movedIn, {
        id: `cannot_burst_${movedIn.uid}_${next.roundNumber}`,
        type: "CannotBurst",
        remainingRounds: 1,
        sourceId: "Switch",
      });

      addStatus(movedIn, {
        id: `entry_guard_${movedIn.uid}_${next.roundNumber}`,
        type: "GuardBoost",
        remainingRounds: 1,
        sourceId: "Switch",
      });

      addStatus(movedIn, {
        id: `entry_read_${movedIn.uid}_${next.roundNumber}`,
        type: "ReadBuff",
        remainingRounds: 1,
        sourceId: "Switch",
      });

      team.switchesUsedThisRound += 1;

      pushPopup(
        next,
        createPopupFromDefinition(ARENA_POPUPS.action.switch, {
          side,
          slotId: originalSlotId,
          sourceUnitUid: actingUnit.uid,
          targetUnitUid: movedIn.uid,
        }),
      );

      pushPopup(
        next,
        createPopupFromDefinition(ARENA_POPUPS.result.entry, {
          side,
          slotId: originalSlotId,
          targetUnitUid: movedIn.uid,
        }),
      );

      addBattleLog(
        next,
        `${side} switches ${actingUnit.cardName} out for ${movedIn.cardName}.`,
      );

      break;
    }
  }

  return next;
}

export function resolveSupportPhase(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);
  next.phase = "support";

  for (const side of ["player", "enemy"] as ArenaClashSide[]) {
    const commands =
      side === "player" ? next.queuedPlayerCommands : next.queuedEnemyCommands;

    const supportCommand = commands.find((command) => Boolean(command.chosenSupportId));
    if (!supportCommand?.chosenSupportId) continue;

    applySupportToTeam({
      state: next,
      side,
      supportId: supportCommand.chosenSupportId,
    });
  }

  return next;
}

export function resolveGuardChargePhase(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);
  next.phase = "guard-charge";

  const allResolved = sortResolvedCommandsByInitiative([
    ...getResolvedCommandsForSide(next, "player"),
    ...getResolvedCommandsForSide(next, "enemy"),
  ]);

  for (const resolved of allResolved) {
    resolveGuardOrChargeAction({
      state: next,
      resolved,
    });
  }

  return next;
}

export function resolveStrikePhase(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);
  next.phase = "strike";
  resolveAttackPhaseForAction({
    state: next,
    action: "Strike",
  });
  return next;
}

export function resolveBurstPhase(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);
  next.phase = "burst";
  resolveAttackPhaseForAction({
    state: next,
    action: "Burst",
  });
  return next;
}

export function resolveBreakPhase(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);
  next.phase = "break";

  removeEliminatedActiveUnits(next, "player");
  removeEliminatedActiveUnits(next, "enemy");

  const playerFrontBefore = hasLivingFrontline(next.player);
  const enemyFrontBefore = hasLivingFrontline(next.enemy);

  if (!playerFrontBefore) {
    pushPopup(
      next,
      createPopupFromDefinition(ARENA_POPUPS.state.frontDown, {
        side: "player",
        slotId: null,
      }),
    );
    addBattleLog(next, "Player frontline is down.");
  }

  if (!enemyFrontBefore) {
    pushPopup(
      next,
      createPopupFromDefinition(ARENA_POPUPS.state.frontDown, {
        side: "enemy",
        slotId: null,
      }),
    );
    addBattleLog(next, "Enemy frontline is down.");
  }

  if (!hasLivingCore(next.player)) {
    pushPopup(
      next,
      createPopupFromDefinition(ARENA_POPUPS.state.coreOpen, {
        side: "player",
        slotId: null,
      }),
    );
    addBattleLog(next, "Player core is open.");
  }

  if (!hasLivingCore(next.enemy)) {
    pushPopup(
      next,
      createPopupFromDefinition(ARENA_POPUPS.state.coreOpen, {
        side: "enemy",
        slotId: null,
      }),
    );
    addBattleLog(next, "Enemy core is open.");
  }

  return checkMatchEnd(next);
}

function generateStoredForce(team: ArenaClashTeamState) {
  const totalForce = getLivingActiveUnits(team).reduce(
    (sum, unit) => sum + unit.force,
    0,
  );

  if (totalForce >= 70) {
    applyTeamStoredForceDelta(team, 1);
  }
}

export function cleanupEndOfRound(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  const next = cloneMatchState(state);

  generateStoredForce(next.player);
  generateStoredForce(next.enemy);

  tickTeamForNewRound(next.player);
  tickTeamForNewRound(next.enemy);

  next.queuedPlayerCommands = [];
  next.queuedEnemyCommands = [];

  if (next.phase !== "finished") {
    next.phase = "command";
    next.roundNumber += 1;
  }

  return next;
}

export function resolveArenaClashRound(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  let next = cloneMatchState(state);

  if (next.phase === "finished") return next;

  if (next.phase === "deploy") {
    return resolveDeployPhase(next);
  }

  if (next.phase === "enemy-deploy") {
    return resolveEnemyDeployPhase(next);
  }

  if (next.queuedEnemyCommands.length === 0) {
    next.queuedEnemyCommands = buildEnemyAutoCommands(next);
  }

  resetTeamRoundCounters(next.player);
  resetTeamRoundCounters(next.enemy);

  next = resolveSwitchPhase(next);
  next = resolveSupportPhase(next);
  next = resolveGuardChargePhase(next);
  next = resolveStrikePhase(next);
  next = resolveBurstPhase(next);
  next = resolveBreakPhase(next);

  if (next.phase === "finished") {
    return next;
  }

  next = cleanupEndOfRound(next);
  return next;
}