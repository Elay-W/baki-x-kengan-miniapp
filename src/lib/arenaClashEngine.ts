import {
  ARENA_CLASH_TEMPO_PER_NEW_ROUND,
  clampArenaClashFocus,
  clampArenaClashTempo,
  createArenaClashTeamState,
  getArenaClashActiveCard,
  getArenaClashTempoCostByRarity,
  type ArenaClashActionSelection,
  type ArenaClashBattleCardRuntime,
  type ArenaClashBattleResult,
  type ArenaClashFighterCard,
  type ArenaClashMatchState,
  type ArenaClashSide,
  type ArenaClashStatusApplication,
  type ArenaClashStatusInstance,
  type ArenaClashStatusType,
  type ArenaClashTeamState,
} from "@/lib/arenaClashTypes";
import {
  getArenaClashSkill,
  resolveArenaClashSkillKey,
} from "@/lib/arenaClashSkillRegistry";
import { resolveArenaClashExchange } from "@/lib/arenaClashResolver";

function cloneStatus(status: ArenaClashStatusInstance): ArenaClashStatusInstance {
  return {
    type: status.type,
    durationExchanges: status.durationExchanges,
    stacks: status.stacks,
    sourceCardId: status.sourceCardId,
  };
}

function cloneCard(card: ArenaClashBattleCardRuntime): ArenaClashBattleCardRuntime {
  return {
    ...card,
    card: {
      ...card.card,
      stats: { ...card.card.stats },
      tags: card.card.tags ? [...card.card.tags] : undefined,
    },
    statuses: card.statuses.map(cloneStatus),
    skillState: {
      cooldowns: { ...card.skillState.cooldowns },
      usedThisBattle: { ...card.skillState.usedThisBattle },
      usedThisFielding: { ...card.skillState.usedThisFielding },
    },
    flags: { ...card.flags },
  };
}

function cloneTeam(team: ArenaClashTeamState): ArenaClashTeamState {
  return {
    ...team,
    fighters: team.fighters.map(cloneCard),
  };
}

function cloneMatchState(state: ArenaClashMatchState): ArenaClashMatchState {
  return {
    ...state,
    player: cloneTeam(state.player),
    enemy: cloneTeam(state.enemy),
    currentRound: { ...state.currentRound },
    pendingPlayerAction: state.pendingPlayerAction
      ? { ...state.pendingPlayerAction }
      : null,
    pendingEnemyAction: state.pendingEnemyAction
      ? { ...state.pendingEnemyAction }
      : null,
    lastResolution: state.lastResolution
      ? {
          ...state.lastResolution,
          playerAction: { ...state.lastResolution.playerAction },
          enemyAction: { ...state.lastResolution.enemyAction },
          clashes: state.lastResolution.clashes.map((item) => ({ ...item })),
          stateTransitions: state.lastResolution.stateTransitions.map((item) => ({
            ...item,
          })),
          statusApplications: state.lastResolution.statusApplications.map((item) => ({
            ...item,
          })),
          focusChanges: { ...state.lastResolution.focusChanges },
          tempoChanges: { ...state.lastResolution.tempoChanges },
          logs: [...state.lastResolution.logs],
        }
      : null,
    result: state.result ? { ...state.result } : null,
    battleLog: [...state.battleLog],
  };
}

function getTeam(match: ArenaClashMatchState, side: ArenaClashSide): ArenaClashTeamState {
  return side === "player" ? match.player : match.enemy;
}

function getStatusDuration(status: ArenaClashStatusType): number {
  switch (status) {
    case "Strain":
      return 2;
    case "Bleed":
      return 2;
    case "Shield":
      return 1;
    case "Stun":
      return 1;
    case "GuardBreak":
      return 1;
    case "TempoDown":
      return 1;
    default:
      return 1;
  }
}

function mergeOrApplyStatus(
  card: ArenaClashBattleCardRuntime,
  application: ArenaClashStatusApplication,
) {
  const duration = getStatusDuration(application.status);
  const existing = card.statuses.find((s) => s.type === application.status);

  if (existing) {
    existing.durationExchanges = Math.max(existing.durationExchanges, duration);
    existing.stacks = Math.max(existing.stacks ?? 1, 1);
    return;
  }

  card.statuses.push({
    type: application.status,
    durationExchanges: duration,
    stacks: 1,
    sourceCardId: card.card.id,
  });
}

function tickExistingStatusesAndCooldowns(match: ArenaClashMatchState) {
  const teams = [match.player, match.enemy];

  for (const team of teams) {
    for (const fighter of team.fighters) {
      fighter.statuses = fighter.statuses
        .map((status) => ({
          ...status,
          durationExchanges: status.durationExchanges - 1,
        }))
        .filter((status) => status.durationExchanges > 0);

      for (const key of Object.keys(fighter.skillState.cooldowns)) {
        const current = fighter.skillState.cooldowns[key] ?? 0;
        if (current > 0) {
          fighter.skillState.cooldowns[key] = current - 1;
        }
      }
    }
  }
}

function resolveSkillForAction(
  card: ArenaClashBattleCardRuntime,
  action: ArenaClashActionSelection,
) {
  if (action.type !== "Skill") {
    return null;
  }

  const explicitKey = action.skillKey?.trim();
  if (explicitKey) {
    return getArenaClashSkill(explicitKey);
  }

  const fallbackKey = resolveArenaClashSkillKey(card.card);
  return getArenaClashSkill(fallbackKey);
}

function markSkillUsage(
  card: ArenaClashBattleCardRuntime,
  action: ArenaClashActionSelection,
) {
  const skill = resolveSkillForAction(card, action);
  if (!skill) {
    return;
  }

  card.skillState.usedThisBattle[skill.key] = true;
  card.skillState.usedThisFielding[skill.key] = true;

  if (skill.cooldownExchanges && skill.cooldownExchanges > 0) {
    card.skillState.cooldowns[skill.key] = skill.cooldownExchanges;
  }
}

function applyTeamTempoDelta(team: ArenaClashTeamState, delta: number) {
  team.tempo = clampArenaClashTempo(team.tempo + delta);
}

function applyFocusDelta(card: ArenaClashBattleCardRuntime, delta: number) {
  card.focus = clampArenaClashFocus(card.focus + delta);
}

function applyResolutionStateTransitions(match: ArenaClashMatchState) {
  const resolution = match.lastResolution;
  if (!resolution) return;

  for (const transition of resolution.stateTransitions) {
    const team = getTeam(match, transition.side);
    const fighter = team.fighters[transition.slot];
    if (!fighter) continue;
    fighter.state = transition.to;
  }
}

function applyResolutionStatuses(match: ArenaClashMatchState) {
  const resolution = match.lastResolution;
  if (!resolution) return;

  for (const application of resolution.statusApplications) {
    const team = getTeam(match, application.side);
    const fighter = team.fighters[application.slot];
    if (!fighter || !application.applied) continue;
    mergeOrApplyStatus(fighter, application);
  }
}

function findNextAvailableSlot(team: ArenaClashTeamState): number | null {
  for (const fighter of team.fighters) {
    if (fighter.slot !== team.activeSlot && fighter.state !== "KO") {
      return fighter.slot;
    }
  }

  return null;
}

function grantEntryFocus(card: ArenaClashBattleCardRuntime) {
  card.focus = clampArenaClashFocus(card.focus + 1);
}

function enterField(
  team: ArenaClashTeamState,
  slot: number,
  bySwitch: boolean,
) {
  const previousActive = team.fighters[team.activeSlot];
  if (previousActive) {
    previousActive.guardStreak = 0;
    previousActive.chargeStreak = 0;
  }

  team.activeSlot = slot;

  const fighter = team.fighters[slot];
  fighter.flags.hasEnteredField = true;
  fighter.flags.switchedInThisRound = bySwitch;
  fighter.guardStreak = 0;
  fighter.chargeStreak = 0;
  fighter.skillState.usedThisFielding = {};
  grantEntryFocus(fighter);
}

function resetRoundFlags(match: ArenaClashMatchState) {
  for (const fighter of match.player.fighters) {
    fighter.flags.switchedInThisRound = false;
    fighter.flags.knockedOutBySwitchPunish = false;
  }

  for (const fighter of match.enemy.fighters) {
    fighter.flags.switchedInThisRound = false;
    fighter.flags.knockedOutBySwitchPunish = false;
  }
}

function startNewRound(match: ArenaClashMatchState) {
  applyTeamTempoDelta(match.player, ARENA_CLASH_TEMPO_PER_NEW_ROUND);
  applyTeamTempoDelta(match.enemy, ARENA_CLASH_TEMPO_PER_NEW_ROUND);

  match.currentRound = {
    roundNumber: match.currentRound.roundNumber + 1,
    startedAtExchange: match.exchangeNumber,
    activePlayerSlot: match.player.activeSlot,
    activeEnemySlot: match.enemy.activeSlot,
  };

  resetRoundFlags(match);
}

function setMatchResult(
  match: ArenaClashMatchState,
  winner: ArenaClashSide | null,
  loser: ArenaClashSide | null,
  reason: ArenaClashBattleResult["reason"],
) {
  match.result = {
    winner,
    loser,
    reason,
  };
  match.phase = "match-end";
}

function tryAutoFieldAfterKO(
  match: ArenaClashMatchState,
  side: ArenaClashSide,
): boolean {
  const team = getTeam(match, side);
  const active = getArenaClashActiveCard(team);

  if (active.state !== "KO") {
    return true;
  }

  const nextSlot = findNextAvailableSlot(team);
  if (nextSlot == null) {
    return false;
  }

  const nextFighter = team.fighters[nextSlot];
  const cost = getArenaClashTempoCostByRarity(nextFighter.rarity);

  if (team.tempo < cost) {
    return false;
  }

  applyTeamTempoDelta(team, -cost);
  enterField(team, nextSlot, false);
  match.battleLog.push(
    `${side} fields ${nextFighter.card.name} for ${cost} Tempo after a KO.`,
  );
  return true;
}

function isAggressiveSkillType(type: string | undefined): boolean {
  return (
    type === "Burst" ||
    type === "Pierce" ||
    type === "Control" ||
    type === "Utility"
  );
}

function isAggressiveAction(
  team: ArenaClashTeamState,
  action: ArenaClashActionSelection,
): boolean {
  if (action.type === "Strike") {
    return true;
  }

  if (action.type !== "Skill") {
    return false;
  }

  const active = getArenaClashActiveCard(team);
  const skill = resolveSkillForAction(active, action);
  return isAggressiveSkillType(skill?.type);
}

function didSideSwitchSuccessfully(
  playerTeamBefore: ArenaClashTeamState,
  enemyTeamBefore: ArenaClashTeamState,
  resolution: NonNullable<ArenaClashMatchState["lastResolution"]>,
  side: ArenaClashSide,
): boolean {
  const selfAction = side === "player" ? resolution.playerAction : resolution.enemyAction;
  const oppAction = side === "player" ? resolution.enemyAction : resolution.playerAction;

  if (selfAction.type !== "Switch" || selfAction.targetReserveSlot == null) {
    return false;
  }

  const opponentTeamBefore = side === "player" ? enemyTeamBefore : playerTeamBefore;

  if (isAggressiveAction(opponentTeamBefore, oppAction)) {
    const switchCheck = resolution.clashes.find((clash) => clash.kind === "SwitchCheck");
    return switchCheck?.winnerSide === side;
  }

  return true;
}

function applySuccessfulSwitches(
  match: ArenaClashMatchState,
  playerTeamBefore: ArenaClashTeamState,
  enemyTeamBefore: ArenaClashTeamState,
): { playerSwitched: boolean; enemySwitched: boolean } {
  const resolution = match.lastResolution;
  if (!resolution) {
    return { playerSwitched: false, enemySwitched: false };
  }

  let playerSwitched = false;
  let enemySwitched = false;

  if (didSideSwitchSuccessfully(playerTeamBefore, enemyTeamBefore, resolution, "player")) {
    const slot = resolution.playerAction.targetReserveSlot!;
    enterField(match.player, slot, true);
    match.battleLog.push(`player successfully switches to ${match.player.fighters[slot].card.name}.`);
    playerSwitched = true;
  }

  if (didSideSwitchSuccessfully(playerTeamBefore, enemyTeamBefore, resolution, "enemy")) {
    const slot = resolution.enemyAction.targetReserveSlot!;
    enterField(match.enemy, slot, true);
    match.battleLog.push(`enemy successfully switches to ${match.enemy.fighters[slot].card.name}.`);
    enemySwitched = true;
  }

  return { playerSwitched, enemySwitched };
}

function updateActionStreaks(
  card: ArenaClashBattleCardRuntime,
  action: ArenaClashActionSelection,
) {
  if (action.type === "Guard") {
    card.guardStreak += 1;
  } else {
    card.guardStreak = 0;
  }

  if (action.type === "Charge") {
    card.chargeStreak += 1;
  } else {
    card.chargeStreak = 0;
  }
}

function handlePotentialMatchEndAfterKO(match: ArenaClashMatchState): boolean {
  const playerAlive = match.player.fighters.some((fighter) => fighter.state !== "KO");
  const enemyAlive = match.enemy.fighters.some((fighter) => fighter.state !== "KO");

  if (!playerAlive && !enemyAlive) {
    setMatchResult(match, null, null, "all_ko");
    return true;
  }

  if (!playerAlive) {
    setMatchResult(match, "enemy", "player", "all_ko");
    return true;
  }

  if (!enemyAlive) {
    setMatchResult(match, "player", "enemy", "all_ko");
    return true;
  }

  const playerCanField = tryAutoFieldAfterKO(match, "player");
  const enemyCanField = tryAutoFieldAfterKO(match, "enemy");

  if (!playerCanField && !enemyCanField) {
    setMatchResult(match, null, null, "no_tempo_to_field");
    return true;
  }

  if (!playerCanField) {
    setMatchResult(match, "enemy", "player", "no_tempo_to_field");
    return true;
  }

  if (!enemyCanField) {
    setMatchResult(match, "player", "enemy", "no_tempo_to_field");
    return true;
  }

  return false;
}

export function createArenaClashMatchState(
  playerCards: ArenaClashFighterCard[],
  enemyCards: ArenaClashFighterCard[],
): ArenaClashMatchState {
  if (playerCards.length === 0) {
    throw new Error("Player team cannot be empty.");
  }

  if (enemyCards.length === 0) {
    throw new Error("Enemy team cannot be empty.");
  }

  const player = createArenaClashTeamState("player", playerCards);
  const enemy = createArenaClashTeamState("enemy", enemyCards);

  return {
    mode: "arena-clash",
    phase: "choose-actions",
    player,
    enemy,
    currentRound: {
      roundNumber: 1,
      startedAtExchange: 0,
      activePlayerSlot: player.activeSlot,
      activeEnemySlot: enemy.activeSlot,
    },
    exchangeNumber: 0,
    pendingPlayerAction: null,
    pendingEnemyAction: null,
    lastResolution: null,
    result: null,
    battleLog: ["Arena Clash started."],
  };
}

export function resolveArenaClashStep(
  state: ArenaClashMatchState,
  playerAction: ArenaClashActionSelection,
  enemyAction: ArenaClashActionSelection,
): ArenaClashMatchState {
  if (state.result || state.phase === "match-end") {
    return state;
  }

  const next = cloneMatchState(state);

  const playerTeamBefore = cloneTeam(next.player);
  const enemyTeamBefore = cloneTeam(next.enemy);

  const playerActiveSlotBefore = next.player.activeSlot;
  const enemyActiveSlotBefore = next.enemy.activeSlot;

  next.phase = "resolve-exchange";
  next.pendingPlayerAction = { ...playerAction };
  next.pendingEnemyAction = { ...enemyAction };
  next.exchangeNumber += 1;

  const resolution = resolveArenaClashExchange({
    playerTeam: next.player,
    enemyTeam: next.enemy,
    playerAction,
    enemyAction,
    exchangeNumber: next.exchangeNumber,
  });

  next.lastResolution = resolution;
  next.battleLog.push(...resolution.logs);

  applyTeamTempoDelta(next.player, resolution.tempoChanges.player);
  applyTeamTempoDelta(next.enemy, resolution.tempoChanges.enemy);

  applyFocusDelta(
    next.player.fighters[playerActiveSlotBefore],
    resolution.focusChanges.player,
  );
  applyFocusDelta(
    next.enemy.fighters[enemyActiveSlotBefore],
    resolution.focusChanges.enemy,
  );

  updateActionStreaks(next.player.fighters[playerActiveSlotBefore], resolution.playerAction);
  updateActionStreaks(next.enemy.fighters[enemyActiveSlotBefore], resolution.enemyAction);

  markSkillUsage(next.player.fighters[playerActiveSlotBefore], resolution.playerAction);
  markSkillUsage(next.enemy.fighters[enemyActiveSlotBefore], resolution.enemyAction);

  applyResolutionStateTransitions(next);

  tickExistingStatusesAndCooldowns(next);
  applyResolutionStatuses(next);

  const { playerSwitched, enemySwitched } = applySuccessfulSwitches(
    next,
    playerTeamBefore,
    enemyTeamBefore,
  );

  const playerActiveIsKO = getArenaClashActiveCard(next.player).state === "KO";
  const enemyActiveIsKO = getArenaClashActiveCard(next.enemy).state === "KO";

  const shouldAdvanceRound =
    playerSwitched || enemySwitched || playerActiveIsKO || enemyActiveIsKO;

  if (shouldAdvanceRound) {
    startNewRound(next);

    const ended = handlePotentialMatchEndAfterKO(next);
    if (ended) {
      next.pendingPlayerAction = null;
      next.pendingEnemyAction = null;
      return next;
    }
  }

  next.currentRound.activePlayerSlot = next.player.activeSlot;
  next.currentRound.activeEnemySlot = next.enemy.activeSlot;

  next.pendingPlayerAction = null;
  next.pendingEnemyAction = null;
  next.phase = "choose-actions";

  return next;
}