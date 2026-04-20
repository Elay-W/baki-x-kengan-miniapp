import {
  ARENA_CLASH_BROKEN_PENALTY,
  ARENA_CLASH_CHARGE_PENALTY,
  ARENA_CLASH_GUARD_BONUS,
  ARENA_CLASH_PRESSURED_PENALTY,
  ARENA_CLASH_STRAIN_PENALTY,
  clampArenaClashFocus,
  getArenaClashActiveCard,
  getArenaClashNextStateAfterTier,
  getArenaClashTempoCostByRarity,
  isArenaClashCardKO,
  type ArenaClashActionSelection,
  type ArenaClashBattleCardRuntime,
  type ArenaClashExchangeResolution,
  type ArenaClashKind,
  type ArenaClashResultTier,
  type ArenaClashSide,
  type ArenaClashSkillDefinition,
  type ArenaClashSnapshot,
  type ArenaClashStateTransition,
  type ArenaClashStatBlock,
  type ArenaClashStatusApplication,
  type ArenaClashStatusType,
  type ArenaClashTeamState,
} from "@/lib/arenaClashTypes";
import {
  getArenaClashSkill,
  resolveArenaClashSkillKey,
} from "@/lib/arenaClashSkillRegistry";

type ArenaClashResolverInput = {
  playerTeam: ArenaClashTeamState;
  enemyTeam: ArenaClashTeamState;
  playerAction: ArenaClashActionSelection;
  enemyAction: ArenaClashActionSelection;
  exchangeNumber: number;
};

type NormalizedArenaClashAction = {
  side: ArenaClashSide;
  action: ArenaClashActionSelection;
  skill: ArenaClashSkillDefinition | null;
  logs: string[];
};

type ArenaClashStatContext = {
  actor: ArenaClashBattleCardRuntime;
  actorAction: ArenaClashActionSelection;
  actorSkill: ArenaClashSkillDefinition | null;
  clashKind: ArenaClashKind;
  isAttacker: boolean;
  actorSide: ArenaClashSide;
  enemyAction?: ArenaClashActionSelection;
  actorGuardBonus?: boolean;
};

const EPSILON = 0.0001;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function hasStatus(
  card: ArenaClashBattleCardRuntime,
  status: ArenaClashStatusType,
): boolean {
  return card.statuses.some((s) => s.type === status && s.durationExchanges > 0);
}

function pushUniqueStatus(
  list: ArenaClashStatusApplication[],
  side: ArenaClashSide,
  slot: number,
  status: ArenaClashStatusType,
) {
  const exists = list.some(
    (entry) => entry.side === side && entry.slot === slot && entry.status === status,
  );

  if (!exists) {
    list.push({
      side,
      slot,
      status,
      applied: true,
    });
  }
}

function shiftTier(
  tier: ArenaClashResultTier,
  amount: -1 | 0 | 1,
): ArenaClashResultTier {
  const order: ArenaClashResultTier[] = ["none", "light", "clean", "crush"];
  const index = order.indexOf(tier);
  const next = Math.max(0, Math.min(order.length - 1, index + amount));
  return order[next];
}

function getSkillFromAction(
  card: ArenaClashBattleCardRuntime,
  action: ArenaClashActionSelection,
): ArenaClashSkillDefinition | null {
  if (action.type !== "Skill") {
    return null;
  }

  const explicitKey = action.skillKey?.trim();
  if (explicitKey) {
    return getArenaClashSkill(explicitKey);
  }

  const resolvedKey = resolveArenaClashSkillKey(card.card);
  return getArenaClashSkill(resolvedKey);
}

function normalizeActionForSide(
  team: ArenaClashTeamState,
  enemyTeam: ArenaClashTeamState,
  side: ArenaClashSide,
  action: ArenaClashActionSelection,
): NormalizedArenaClashAction {
  const logs: string[] = [];
  const active = getArenaClashActiveCard(team);

  if (isArenaClashCardKO(active)) {
    logs.push(`${side}: active fighter is KO and cannot act.`);
    return {
      side,
      action: { type: "Guard" },
      skill: null,
      logs,
    };
  }

  if (action.type === "Skill") {
    const skill = getSkillFromAction(active, action);

    if (!skill) {
      logs.push(`${side}: skill was invalid, falling back to Strike.`);
      return {
        side,
        action: { type: "Strike" },
        skill: null,
        logs,
      };
    }

    if (active.focus < skill.focusCost) {
      logs.push(`${side}: not enough Focus for ${skill.name}, falling back to Strike.`);
      return {
        side,
        action: { type: "Strike" },
        skill: null,
        logs,
      };
    }

    const cooldown = active.skillState.cooldowns[skill.key] ?? 0;
    if (cooldown > 0) {
      logs.push(`${side}: ${skill.name} is on cooldown, falling back to Strike.`);
      return {
        side,
        action: { type: "Strike" },
        skill: null,
        logs,
      };
    }

    if (skill.oncePerBattle && active.skillState.usedThisBattle[skill.key]) {
      logs.push(`${side}: ${skill.name} is once per battle and already used.`);
      return {
        side,
        action: { type: "Strike" },
        skill: null,
        logs,
      };
    }

    if (skill.oncePerFielding && active.skillState.usedThisFielding[skill.key]) {
      logs.push(`${side}: ${skill.name} is once per fielding and already used.`);
      return {
        side,
        action: { type: "Strike" },
        skill: null,
        logs,
      };
    }

    return {
      side,
      action,
      skill,
      logs,
    };
  }

  if (action.type === "Switch") {
    const targetSlot = action.targetReserveSlot;

    if (targetSlot == null) {
      logs.push(`${side}: Switch has no target slot, falling back to Guard.`);
      return {
        side,
        action: { type: "Guard" },
        skill: null,
        logs,
      };
    }

    if (targetSlot === team.activeSlot) {
      logs.push(`${side}: Switch target equals active slot, falling back to Guard.`);
      return {
        side,
        action: { type: "Guard" },
        skill: null,
        logs,
      };
    }

    const target = team.fighters[targetSlot];
    if (!target || isArenaClashCardKO(target)) {
      logs.push(`${side}: Switch target is invalid or KO, falling back to Guard.`);
      return {
        side,
        action: { type: "Guard" },
        skill: null,
        logs,
      };
    }

    const cost = getArenaClashTempoCostByRarity(target.rarity);
    if (team.tempo < cost) {
      logs.push(`${side}: not enough Tempo to switch in ${target.card.name}, falling back to Guard.`);
      return {
        side,
        action: { type: "Guard" },
        skill: null,
        logs,
      };
    }

    return {
      side,
      action,
      skill: null,
      logs,
    };
  }

  void enemyTeam;

  return {
    side,
    action,
    skill: null,
    logs,
  };
}

function getBaseStats(card: ArenaClashBattleCardRuntime): ArenaClashStatBlock {
  return { ...card.card.stats };
}

function applyDelta(
  stats: ArenaClashStatBlock,
  delta: Partial<ArenaClashStatBlock>,
): ArenaClashStatBlock {
  const next = { ...stats };

  (Object.keys(delta) as (keyof ArenaClashStatBlock)[]).forEach((key) => {
    next[key] = Math.max(0, next[key] + (delta[key] ?? 0));
  });

  return next;
}

function getStatsForClash(ctx: ArenaClashStatContext): ArenaClashStatBlock {
  let stats = getBaseStats(ctx.actor);

  if (ctx.actor.state === "Pressured") {
    stats = applyDelta(stats, ARENA_CLASH_PRESSURED_PENALTY);
  }

  if (ctx.actor.state === "Broken") {
    stats = applyDelta(stats, ARENA_CLASH_BROKEN_PENALTY);
  }

  if (hasStatus(ctx.actor, "Strain")) {
    stats = applyDelta(stats, ARENA_CLASH_STRAIN_PENALTY);
  }

  if (hasStatus(ctx.actor, "TempoDown")) {
    stats = applyDelta(stats, {
      SPD: -8,
      INSTINCT: -6,
    });
  }

  if (hasStatus(ctx.actor, "Stun")) {
    stats = applyDelta(stats, {
      SPD: -20,
    });
  }

  if (ctx.actorAction.type === "Guard" && ctx.actorGuardBonus) {
    stats = applyDelta(stats, ARENA_CLASH_GUARD_BONUS);
  }

  if (ctx.actorAction.type === "Charge") {
    stats = applyDelta(stats, ARENA_CLASH_CHARGE_PENALTY);
  }

  const skill = ctx.actorSkill;
  if (skill && skill.modifiesClash?.includes(ctx.clashKind) && skill.flatBonuses) {
    stats = applyDelta(stats, skill.flatBonuses);
  }

  return stats;
}

function getWeightShift(
  skill: ArenaClashSkillDefinition | null,
  key:
    | "speedSPD"
    | "speedINSTINCT"
    | "entrySPD"
    | "entryTECH"
    | "entryINSTINCT"
    | "entryDEF"
    | "powerSTR"
    | "powerTECH"
    | "powerDEF"
    | "powerDUR"
    | "reversalTECH"
    | "reversalINSTINCT"
    | "reversalSTR"
    | "reversalSPD",
): number {
  return skill?.weightShift?.[key] ?? 0;
}

function buildClashSnapshot(
  kind: ArenaClashKind,
  attackerSide: ArenaClashSide,
  defenderSide: ArenaClashSide,
  attackerValue: number,
  defenderValue: number,
): ArenaClashSnapshot {
  const difference = round2(Math.abs(attackerValue - defenderValue));

  let winnerSide: ArenaClashSide | "draw" = "draw";
  if (attackerValue > defenderValue + EPSILON) {
    winnerSide = attackerSide;
  } else if (defenderValue > attackerValue + EPSILON) {
    winnerSide = defenderSide;
  }

  return {
    kind,
    attackerSide,
    defenderSide,
    attackerValue: round2(attackerValue),
    defenderValue: round2(defenderValue),
    difference,
    winnerSide,
  };
}

function speedClash(
  attacker: ArenaClashBattleCardRuntime,
  defender: ArenaClashBattleCardRuntime,
  attackerAction: ArenaClashActionSelection,
  defenderAction: ArenaClashActionSelection,
  attackerSkill: ArenaClashSkillDefinition | null,
  defenderSkill: ArenaClashSkillDefinition | null,
): ArenaClashSnapshot {
  const atk = getStatsForClash({
    actor: attacker,
    actorAction: attackerAction,
    actorSkill: attackerSkill,
    clashKind: "SpeedClash",
    isAttacker: true,
    actorSide: attacker.owner,
    enemyAction: defenderAction,
  });

  const def = getStatsForClash({
    actor: defender,
    actorAction: defenderAction,
    actorSkill: defenderSkill,
    clashKind: "SpeedClash",
    isAttacker: false,
    actorSide: defender.owner,
    enemyAction: attackerAction,
  });

  const atkValue =
    atk.SPD * (0.6 + getWeightShift(attackerSkill, "speedSPD")) +
    atk.INSTINCT * (0.4 + getWeightShift(attackerSkill, "speedINSTINCT"));

  let defInstinct = def.INSTINCT;
  if (attackerSkill?.ignoreInstinctPercent) {
    defInstinct *= 1 - attackerSkill.ignoreInstinctPercent / 100;
  }

  const defValue =
    def.SPD * (0.6 + getWeightShift(defenderSkill, "speedSPD")) +
    defInstinct * (0.4 + getWeightShift(defenderSkill, "speedINSTINCT"));

  return buildClashSnapshot(
    "SpeedClash",
    attacker.owner,
    defender.owner,
    atkValue,
    defValue,
  );
}

function entryClash(
  attacker: ArenaClashBattleCardRuntime,
  defender: ArenaClashBattleCardRuntime,
  attackerAction: ArenaClashActionSelection,
  defenderAction: ArenaClashActionSelection,
  attackerSkill: ArenaClashSkillDefinition | null,
  defenderSkill: ArenaClashSkillDefinition | null,
): ArenaClashSnapshot {
  const atk = getStatsForClash({
    actor: attacker,
    actorAction: attackerAction,
    actorSkill: attackerSkill,
    clashKind: "EntryClash",
    isAttacker: true,
    actorSide: attacker.owner,
    enemyAction: defenderAction,
  });

  const def = getStatsForClash({
    actor: defender,
    actorAction: defenderAction,
    actorSkill: defenderSkill,
    clashKind: "EntryClash",
    isAttacker: false,
    actorSide: defender.owner,
    enemyAction: attackerAction,
    actorGuardBonus: defenderAction.type === "Guard" || defenderSkill?.type === "Stance",
  });

  const atkValue =
    atk.SPD * (0.35 + getWeightShift(attackerSkill, "entrySPD")) +
    atk.TECH * (0.25 + getWeightShift(attackerSkill, "entryTECH")) +
    atk.INSTINCT * (0.4 + getWeightShift(attackerSkill, "entryINSTINCT"));

  let defInstinct = def.INSTINCT;
  if (attackerSkill?.ignoreInstinctPercent) {
    defInstinct *= 1 - attackerSkill.ignoreInstinctPercent / 100;
  }

  const defValue =
    def.SPD * 0.25 +
    def.DEF * (0.25 + getWeightShift(defenderSkill, "entryDEF")) +
    defInstinct * (0.5 + getWeightShift(defenderSkill, "entryINSTINCT"));

  return buildClashSnapshot(
    "EntryClash",
    attacker.owner,
    defender.owner,
    atkValue,
    defValue,
  );
}

function powerClash(
  attacker: ArenaClashBattleCardRuntime,
  defender: ArenaClashBattleCardRuntime,
  attackerAction: ArenaClashActionSelection,
  defenderAction: ArenaClashActionSelection,
  attackerSkill: ArenaClashSkillDefinition | null,
  defenderSkill: ArenaClashSkillDefinition | null,
): ArenaClashSnapshot {
  const atk = getStatsForClash({
    actor: attacker,
    actorAction: attackerAction,
    actorSkill: attackerSkill,
    clashKind: "PowerClash",
    isAttacker: true,
    actorSide: attacker.owner,
    enemyAction: defenderAction,
  });

  const def = getStatsForClash({
    actor: defender,
    actorAction: defenderAction,
    actorSkill: defenderSkill,
    clashKind: "PowerClash",
    isAttacker: false,
    actorSide: defender.owner,
    enemyAction: attackerAction,
    actorGuardBonus: defenderAction.type === "Guard" || defenderSkill?.type === "Stance",
  });

  let effectiveDef = def.DEF;
  let effectiveDur = def.DUR;

  if (hasStatus(defender, "GuardBreak")) {
    effectiveDef *= 0.75;
  }

  if (attackerSkill?.ignoreDefensePercent) {
    effectiveDef *= 1 - attackerSkill.ignoreDefensePercent / 100;
  }

  if (attackerSkill?.ignoreDurabilityPercent) {
    effectiveDur *= 1 - attackerSkill.ignoreDurabilityPercent / 100;
  }

  const atkValue =
    atk.STR * (0.6 + getWeightShift(attackerSkill, "powerSTR")) +
    atk.TECH * (0.4 + getWeightShift(attackerSkill, "powerTECH"));

  const defValue =
    effectiveDef * (0.55 + getWeightShift(defenderSkill, "powerDEF")) +
    effectiveDur * (0.45 + getWeightShift(defenderSkill, "powerDUR"));

  return buildClashSnapshot(
    "PowerClash",
    attacker.owner,
    defender.owner,
    atkValue,
    defValue,
  );
}

function reversalClash(
  counterer: ArenaClashBattleCardRuntime,
  incoming: ArenaClashBattleCardRuntime,
  counterAction: ArenaClashActionSelection,
  incomingAction: ArenaClashActionSelection,
  counterSkill: ArenaClashSkillDefinition | null,
  incomingSkill: ArenaClashSkillDefinition | null,
): ArenaClashSnapshot {
  const ctr = getStatsForClash({
    actor: counterer,
    actorAction: counterAction,
    actorSkill: counterSkill,
    clashKind: "ReversalClash",
    isAttacker: false,
    actorSide: counterer.owner,
    enemyAction: incomingAction,
  });

  const inc = getStatsForClash({
    actor: incoming,
    actorAction: incomingAction,
    actorSkill: incomingSkill,
    clashKind: "ReversalClash",
    isAttacker: true,
    actorSide: incoming.owner,
    enemyAction: counterAction,
  });

  const ctrValue =
    ctr.TECH * (0.45 + getWeightShift(counterSkill, "reversalTECH")) +
    ctr.INSTINCT * (0.55 + getWeightShift(counterSkill, "reversalINSTINCT"));

  const incValue =
    inc.STR * (0.5 + getWeightShift(incomingSkill, "reversalSTR")) +
    inc.SPD * (0.25 + getWeightShift(incomingSkill, "reversalSPD")) +
    inc.TECH * 0.25;

  return buildClashSnapshot(
    "ReversalClash",
    incoming.owner,
    counterer.owner,
    incValue,
    ctrValue,
  );
}

function getTierFromDifference(diff: number): ArenaClashResultTier {
  if (diff <= 0) return "none";
  if (diff <= 7) return "light";
  if (diff <= 17) return "clean";
  return "crush";
}

function applyTierModifiers(
  baseTier: ArenaClashResultTier,
  winnerSkill: ArenaClashSkillDefinition | null,
  loserCard: ArenaClashBattleCardRuntime,
): ArenaClashResultTier {
  let tier = baseTier;

  if (winnerSkill?.resultShift?.onWin) {
    tier = shiftTier(tier, winnerSkill.resultShift.onWin);
  }

  if (hasStatus(loserCard, "Bleed")) {
    tier = shiftTier(tier, 1);
  }

  if (hasStatus(loserCard, "Shield")) {
    tier = shiftTier(tier, -1);
  }

  return tier;
}

function pushStateTransition(
  list: ArenaClashStateTransition[],
  side: ArenaClashSide,
  slot: number,
  from: ArenaClashBattleCardRuntime["state"],
  tier: ArenaClashResultTier,
) {
  const to = getArenaClashNextStateAfterTier(from, tier);

  if (from !== to) {
    list.push({
      side,
      slot,
      from,
      to,
    });
  }
}

function isAggressiveSkill(skill: ArenaClashSkillDefinition | null): boolean {
  return skill != null && ["Burst", "Pierce", "Control", "Utility"].includes(skill.type);
}

function isCounterSkill(skill: ArenaClashSkillDefinition | null): boolean {
  return skill?.type === "Counter";
}

function isStanceSkill(skill: ArenaClashSkillDefinition | null): boolean {
  return skill?.type === "Stance";
}

function getFocusRewardForWinner(tier: ArenaClashResultTier): number {
  return tier === "none" ? 0 : 1;
}

function buildBaseResolution(
  exchangeNumber: number,
  playerAction: ArenaClashActionSelection,
  enemyAction: ArenaClashActionSelection,
): ArenaClashExchangeResolution {
  return {
    exchangeNumber,
    playerAction,
    enemyAction,
    primaryClash: "None",
    secondaryClash: undefined,
    resultTier: "none",
    winnerSide: "none",
    clashes: [],
    stateTransitions: [],
    statusApplications: [],
    focusChanges: {
      player: 0,
      enemy: 0,
    },
    tempoChanges: {
      player: 0,
      enemy: 0,
    },
    koOccurred: false,
    roundEnded: false,
    logs: [],
  };
}

function setRoundFlags(resolution: ArenaClashExchangeResolution) {
  resolution.koOccurred = resolution.stateTransitions.some((t) => t.to === "KO");
  resolution.roundEnded = resolution.koOccurred;
}

function applySelfSkillCostsAndStatuses(
  resolution: ArenaClashExchangeResolution,
  side: ArenaClashSide,
  card: ArenaClashBattleCardRuntime,
  skill: ArenaClashSkillDefinition | null,
) {
  if (!skill) return;

  if (side === "player") {
    resolution.focusChanges.player -= skill.focusCost;
  } else {
    resolution.focusChanges.enemy -= skill.focusCost;
  }

  skill.applyStatusesToSelf?.forEach((status) => {
    pushUniqueStatus(resolution.statusApplications, side, card.slot, status);
  });

  resolution.logs.push(`${side} uses ${skill.name}.`);
}

function applyEnemySkillStatusesOnWin(
  resolution: ArenaClashExchangeResolution,
  winnerSide: ArenaClashSide,
  targetSide: ArenaClashSide,
  targetSlot: number,
  skill: ArenaClashSkillDefinition | null,
) {
  if (!skill) return;

  skill.applyStatusesToEnemy?.forEach((status) => {
    pushUniqueStatus(resolution.statusApplications, targetSide, targetSlot, status);
  });

  resolution.logs.push(`${winnerSide} successfully applies ${skill.name} effects.`);
}

function addWinnerFocus(
  resolution: ArenaClashExchangeResolution,
  side: ArenaClashSide | "draw" | "none",
  tier: ArenaClashResultTier,
) {
  const gain = getFocusRewardForWinner(tier);
  if (!gain) return;

  if (side === "player") resolution.focusChanges.player += gain;
  if (side === "enemy") resolution.focusChanges.enemy += gain;
}

function resolveStrikeLikeSequence(params: {
  resolution: ArenaClashExchangeResolution;
  attacker: ArenaClashBattleCardRuntime;
  defender: ArenaClashBattleCardRuntime;
  attackerAction: ArenaClashActionSelection;
  defenderAction: ArenaClashActionSelection;
  attackerSkill: ArenaClashSkillDefinition | null;
  defenderSkill: ArenaClashSkillDefinition | null;
  applyToSlot: number;
  guardDefender?: boolean;
  reducedByOneStep?: boolean;
}) {
  const {
    resolution,
    attacker,
    defender,
    attackerAction,
    defenderAction,
    attackerSkill,
    defenderSkill,
    applyToSlot,
    reducedByOneStep,
  } = params;

  const entry = entryClash(
    attacker,
    defender,
    attackerAction,
    defenderAction,
    attackerSkill,
    defenderSkill,
  );

  resolution.primaryClash = "EntryClash";
  resolution.clashes.push(entry);

  if (entry.winnerSide !== attacker.owner) {
    resolution.winnerSide = defender.owner;
    resolution.resultTier = "light";
    pushStateTransition(
      resolution.stateTransitions,
      attacker.owner,
      attacker.slot,
      attacker.state,
      "light",
    );
    resolution.logs.push(`${defender.card.name} denies the entry.`);
    addWinnerFocus(resolution, defender.owner, "light");
    setRoundFlags(resolution);
    return;
  }

  const power = powerClash(
    attacker,
    defender,
    attackerAction,
    defenderAction,
    attackerSkill,
    defenderSkill,
  );

  resolution.secondaryClash = "PowerClash";
  resolution.clashes.push(power);

  if (power.winnerSide !== attacker.owner) {
    resolution.winnerSide = defender.owner;
    resolution.resultTier = "light";
    pushStateTransition(
      resolution.stateTransitions,
      attacker.owner,
      attacker.slot,
      attacker.state,
      "light",
    );
    resolution.logs.push(`${defender.card.name} absorbs the contact and turns the exchange.`);
    addWinnerFocus(resolution, defender.owner, "light");
    setRoundFlags(resolution);
    return;
  }

  let tier = getTierFromDifference(power.difference);
  tier = applyTierModifiers(tier, attackerSkill, defender);

  if (reducedByOneStep) {
    tier = shiftTier(tier, -1);
  }

  resolution.winnerSide = attacker.owner;
  resolution.resultTier = tier;

  pushStateTransition(
    resolution.stateTransitions,
    defender.owner,
    applyToSlot,
    defender.state,
    tier,
  );

  addWinnerFocus(resolution, attacker.owner, tier);

  if (tier !== "none") {
    applyEnemySkillStatusesOnWin(
      resolution,
      attacker.owner,
      defender.owner,
      applyToSlot,
      attackerSkill,
    );
  }

  setRoundFlags(resolution);
}

function resolveStrikeVsStrike(
  resolution: ArenaClashExchangeResolution,
  playerCard: ArenaClashBattleCardRuntime,
  enemyCard: ArenaClashBattleCardRuntime,
  playerAction: ArenaClashActionSelection,
  enemyAction: ArenaClashActionSelection,
  playerSkill: ArenaClashSkillDefinition | null,
  enemySkill: ArenaClashSkillDefinition | null,
) {
  const speed = speedClash(
    playerCard,
    enemyCard,
    playerAction,
    enemyAction,
    playerSkill,
    enemySkill,
  );

  resolution.primaryClash = "SpeedClash";
  resolution.clashes.push(speed);

  const mutualPressureWindow = speed.difference <= 3;

  if (speed.winnerSide === "draw" && mutualPressureWindow) {
    resolution.winnerSide = "draw";
    resolution.resultTier = "light";
    pushStateTransition(
      resolution.stateTransitions,
      "player",
      playerCard.slot,
      playerCard.state,
      "light",
    );
    pushStateTransition(
      resolution.stateTransitions,
      "enemy",
      enemyCard.slot,
      enemyCard.state,
      "light",
    );
    resolution.logs.push("Both fighters collide in a messy simultaneous exchange.");
    setRoundFlags(resolution);
    return;
  }

  const attacker = speed.winnerSide === "enemy" ? enemyCard : playerCard;
  const defender = attacker.owner === "player" ? enemyCard : playerCard;
  const attackerAction = attacker.owner === "player" ? playerAction : enemyAction;
  const defenderAction = defender.owner === "player" ? playerAction : enemyAction;
  const attackerSkill = attacker.owner === "player" ? playerSkill : enemySkill;
  const defenderSkill = defender.owner === "player" ? playerSkill : enemySkill;

  resolveStrikeLikeSequence({
    resolution,
    attacker,
    defender,
    attackerAction,
    defenderAction,
    attackerSkill,
    defenderSkill,
    applyToSlot: defender.slot,
  });
}

function resolveCounterVsAggression(
  resolution: ArenaClashExchangeResolution,
  counterer: ArenaClashBattleCardRuntime,
  incoming: ArenaClashBattleCardRuntime,
  counterAction: ArenaClashActionSelection,
  incomingAction: ArenaClashActionSelection,
  counterSkill: ArenaClashSkillDefinition | null,
  incomingSkill: ArenaClashSkillDefinition | null,
) {
  const reversal = reversalClash(
    counterer,
    incoming,
    counterAction,
    incomingAction,
    counterSkill,
    incomingSkill,
  );

  resolution.primaryClash = "ReversalClash";
  resolution.clashes.push(reversal);

  if (reversal.winnerSide === counterer.owner) {
    let tier = getTierFromDifference(reversal.difference);
    tier = applyTierModifiers(tier, counterSkill, incoming);

    resolution.winnerSide = counterer.owner;
    resolution.resultTier = tier;

    pushStateTransition(
      resolution.stateTransitions,
      incoming.owner,
      incoming.slot,
      incoming.state,
      tier,
    );

    addWinnerFocus(resolution, counterer.owner, tier);

    if (tier !== "none") {
      applyEnemySkillStatusesOnWin(
        resolution,
        counterer.owner,
        incoming.owner,
        incoming.slot,
        counterSkill,
      );
    }

    resolution.logs.push(`${counterer.card.name} successfully reverses the aggression.`);
  } else if (reversal.winnerSide === incoming.owner) {
    let tier = getTierFromDifference(reversal.difference);
    tier = applyTierModifiers(tier, incomingSkill, counterer);

    resolution.winnerSide = incoming.owner;
    resolution.resultTier = tier;

    pushStateTransition(
      resolution.stateTransitions,
      counterer.owner,
      counterer.slot,
      counterer.state,
      tier,
    );

    addWinnerFocus(resolution, incoming.owner, tier);
    resolution.logs.push(`${incoming.card.name} overwhelms the counter timing.`);
  } else {
    resolution.winnerSide = "draw";
    resolution.resultTier = "none";
    resolution.logs.push("The reversal timing is read and neutralized.");
  }

  setRoundFlags(resolution);
}

function resolveSwitchCheck(
  incomingCard: ArenaClashBattleCardRuntime,
  attacker: ArenaClashBattleCardRuntime,
  incomingAction: ArenaClashActionSelection,
  attackerAction: ArenaClashActionSelection,
  attackerSkill: ArenaClashSkillDefinition | null,
): ArenaClashSnapshot {
  const incomingStats = getStatsForClash({
    actor: incomingCard,
    actorAction: incomingAction,
    actorSkill: null,
    clashKind: "SwitchCheck",
    isAttacker: false,
    actorSide: incomingCard.owner,
    enemyAction: attackerAction,
  });

  const attackerStats = getStatsForClash({
    actor: attacker,
    actorAction: attackerAction,
    actorSkill: attackerSkill,
    clashKind: "SpeedClash",
    isAttacker: true,
    actorSide: attacker.owner,
    enemyAction: incomingAction,
  });

  const incomingValue = incomingStats.SPD * 0.6 + incomingStats.INSTINCT * 0.4;
  const attackerValue = attackerStats.SPD * 0.6 + attackerStats.INSTINCT * 0.4;

  return buildClashSnapshot(
    "SwitchCheck",
    attacker.owner,
    incomingCard.owner,
    attackerValue,
    incomingValue,
  );
}

function spendSwitchTempo(
  resolution: ArenaClashExchangeResolution,
  switchingTeam: ArenaClashTeamState,
  slot: number,
) {
  const incoming = switchingTeam.fighters[slot];
  const cost = getArenaClashTempoCostByRarity(incoming.rarity);

  if (switchingTeam.side === "player") {
    resolution.tempoChanges.player -= cost;
  } else {
    resolution.tempoChanges.enemy -= cost;
  }

  resolution.logs.push(
    `${switchingTeam.side} spends ${cost} Tempo to switch in ${incoming.card.name}.`,
  );
}

function resolveSwitchVsStrikeLike(params: {
  resolution: ArenaClashExchangeResolution;
  switchingTeam: ArenaClashTeamState;
  attackingTeam: ArenaClashTeamState;
  switchAction: ArenaClashActionSelection;
  attackAction: ArenaClashActionSelection;
  attackSkill: ArenaClashSkillDefinition | null;
  attackCard: ArenaClashBattleCardRuntime;
  oldActive: ArenaClashBattleCardRuntime;
}) {
  const {
    resolution,
    switchingTeam,
    switchAction,
    attackAction,
    attackSkill,
    attackCard,
    oldActive,
  } = params;

  const targetSlot = switchAction.targetReserveSlot!;
  const incoming = switchingTeam.fighters[targetSlot];

  spendSwitchTempo(resolution, switchingTeam, targetSlot);

  const check = resolveSwitchCheck(
    incoming,
    attackCard,
    switchAction,
    attackAction,
    attackSkill,
  );

  resolution.primaryClash = "SwitchCheck";
  resolution.clashes.push(check);

  const switchSucceeded = check.winnerSide === switchingTeam.side;

  if (switchSucceeded) {
    resolution.logs.push(`${incoming.card.name} enters in time and catches a weakened hit.`);

    resolveStrikeLikeSequence({
      resolution,
      attacker: attackCard,
      defender: incoming,
      attackerAction: attackAction,
      defenderAction: switchAction,
      attackerSkill: attackSkill,
      defenderSkill: null,
      applyToSlot: incoming.slot,
      reducedByOneStep: true,
    });

    return;
  }

  resolution.logs.push(`${oldActive.card.name} fails to disengage and takes the full punish.`);

  resolveStrikeLikeSequence({
    resolution,
    attacker: attackCard,
    defender: oldActive,
    attackerAction: attackAction,
    defenderAction: switchAction,
    attackerSkill: attackSkill,
    defenderSkill: null,
    applyToSlot: oldActive.slot,
  });
}

export function resolveArenaClashExchange({
  playerTeam,
  enemyTeam,
  playerAction,
  enemyAction,
  exchangeNumber,
}: ArenaClashResolverInput): ArenaClashExchangeResolution {
  const playerCard = getArenaClashActiveCard(playerTeam);
  const enemyCard = getArenaClashActiveCard(enemyTeam);

  const normalizedPlayer = normalizeActionForSide(
    playerTeam,
    enemyTeam,
    "player",
    playerAction,
  );
  const normalizedEnemy = normalizeActionForSide(
    enemyTeam,
    playerTeam,
    "enemy",
    enemyAction,
  );

  const resolution = buildBaseResolution(
    exchangeNumber,
    normalizedPlayer.action,
    normalizedEnemy.action,
  );

  resolution.logs.push(...normalizedPlayer.logs, ...normalizedEnemy.logs);

  applySelfSkillCostsAndStatuses(
    resolution,
    "player",
    playerCard,
    normalizedPlayer.skill,
  );
  applySelfSkillCostsAndStatuses(
    resolution,
    "enemy",
    enemyCard,
    normalizedEnemy.skill,
  );

  const pAction = normalizedPlayer.action;
  const eAction = normalizedEnemy.action;
  const pSkill = normalizedPlayer.skill;
  const eSkill = normalizedEnemy.skill;

  if (pAction.type === "Charge") {
    resolution.focusChanges.player += 1;
    if (playerCard.chargeStreak >= 1) {
      pushUniqueStatus(resolution.statusApplications, "player", playerCard.slot, "TempoDown");
      resolution.logs.push("player overuses Charge and suffers TempoDown.");
    }
  }

  if (eAction.type === "Charge") {
    resolution.focusChanges.enemy += 1;
    if (enemyCard.chargeStreak >= 1) {
      pushUniqueStatus(resolution.statusApplications, "enemy", enemyCard.slot, "TempoDown");
      resolution.logs.push("enemy overuses Charge and suffers TempoDown.");
    }
  }

  if (pAction.type === "Guard" && playerCard.guardStreak >= 2) {
    resolution.logs.push("player is guard-spamming; later engine can weaken the stance.");
  }

  if (eAction.type === "Guard" && enemyCard.guardStreak >= 2) {
    resolution.logs.push("enemy is guard-spamming; later engine can weaken the stance.");
  }

  if (pAction.type === "Guard" && eAction.type === "Guard") {
    resolution.focusChanges.player += 1;
    resolution.focusChanges.enemy += 1;
    resolution.logs.push("Both fighters remain patient and build Focus.");
    return resolution;
  }

  if (pAction.type === "Charge" && eAction.type === "Charge") {
    resolution.logs.push("Both fighters charge and prepare a bigger future exchange.");
    return resolution;
  }

  if (pAction.type === "Guard" && eAction.type === "Charge") {
    resolution.focusChanges.player += 1;
    resolution.logs.push("player stabilizes while enemy charges.");
    return resolution;
  }

  if (pAction.type === "Charge" && eAction.type === "Guard") {
    resolution.focusChanges.enemy += 1;
    resolution.logs.push("enemy stabilizes while player charges.");
    return resolution;
  }

  if (pAction.type === "Switch" && eAction.type === "Guard") {
    spendSwitchTempo(resolution, playerTeam, pAction.targetReserveSlot!);
    resolution.focusChanges.enemy += 1;
    resolution.logs.push("player safely switches under guard pressure.");
    return resolution;
  }

  if (eAction.type === "Switch" && pAction.type === "Guard") {
    spendSwitchTempo(resolution, enemyTeam, eAction.targetReserveSlot!);
    resolution.focusChanges.player += 1;
    resolution.logs.push("enemy safely switches under guard pressure.");
    return resolution;
  }

  if (pAction.type === "Switch" && eAction.type === "Charge") {
    spendSwitchTempo(resolution, playerTeam, pAction.targetReserveSlot!);
    resolution.logs.push("player safely switches while enemy charges.");
    return resolution;
  }

  if (eAction.type === "Switch" && pAction.type === "Charge") {
    spendSwitchTempo(resolution, enemyTeam, eAction.targetReserveSlot!);
    resolution.logs.push("enemy safely switches while player charges.");
    return resolution;
  }

  if (pAction.type === "Switch" && eAction.type === "Switch") {
    spendSwitchTempo(resolution, playerTeam, pAction.targetReserveSlot!);
    spendSwitchTempo(resolution, enemyTeam, eAction.targetReserveSlot!);
    resolution.logs.push("Both players switch at the same time.");
    return resolution;
  }

  if (pAction.type === "Strike" && eAction.type === "Strike") {
    resolveStrikeVsStrike(
      resolution,
      playerCard,
      enemyCard,
      pAction,
      eAction,
      pSkill,
      eSkill,
    );
    return resolution;
  }

  if (pAction.type === "Strike" && eAction.type === "Guard") {
    resolveStrikeLikeSequence({
      resolution,
      attacker: playerCard,
      defender: enemyCard,
      attackerAction: pAction,
      defenderAction: eAction,
      attackerSkill: pSkill,
      defenderSkill: eSkill,
      applyToSlot: enemyCard.slot,
    });

    if (resolution.winnerSide !== "player") {
      resolution.focusChanges.enemy += 1;
    }

    return resolution;
  }

  if (eAction.type === "Strike" && pAction.type === "Guard") {
    resolveStrikeLikeSequence({
      resolution,
      attacker: enemyCard,
      defender: playerCard,
      attackerAction: eAction,
      defenderAction: pAction,
      attackerSkill: eSkill,
      defenderSkill: pSkill,
      applyToSlot: playerCard.slot,
    });

    if (resolution.winnerSide !== "enemy") {
      resolution.focusChanges.player += 1;
    }

    return resolution;
  }

  if (pAction.type === "Strike" && eAction.type === "Charge") {
    resolveStrikeLikeSequence({
      resolution,
      attacker: playerCard,
      defender: enemyCard,
      attackerAction: pAction,
      defenderAction: eAction,
      attackerSkill: pSkill,
      defenderSkill: eSkill,
      applyToSlot: enemyCard.slot,
    });
    return resolution;
  }

  if (eAction.type === "Strike" && pAction.type === "Charge") {
    resolveStrikeLikeSequence({
      resolution,
      attacker: enemyCard,
      defender: playerCard,
      attackerAction: eAction,
      defenderAction: pAction,
      attackerSkill: eSkill,
      defenderSkill: pSkill,
      applyToSlot: playerCard.slot,
    });
    return resolution;
  }

  if (pAction.type === "Strike" && eAction.type === "Switch") {
    resolveSwitchVsStrikeLike({
      resolution,
      switchingTeam: enemyTeam,
      attackingTeam: playerTeam,
      switchAction: eAction,
      attackAction: pAction,
      attackSkill: pSkill,
      attackCard: playerCard,
      oldActive: enemyCard,
    });
    return resolution;
  }

  if (eAction.type === "Strike" && pAction.type === "Switch") {
    resolveSwitchVsStrikeLike({
      resolution,
      switchingTeam: playerTeam,
      attackingTeam: enemyTeam,
      switchAction: pAction,
      attackAction: eAction,
      attackSkill: eSkill,
      attackCard: enemyCard,
      oldActive: playerCard,
    });
    return resolution;
  }

  if (
    pAction.type === "Skill" &&
    isCounterSkill(pSkill) &&
    (eAction.type === "Strike" || (eAction.type === "Skill" && isAggressiveSkill(eSkill)))
  ) {
    resolveCounterVsAggression(
      resolution,
      playerCard,
      enemyCard,
      pAction,
      eAction,
      pSkill,
      eSkill,
    );
    return resolution;
  }

  if (
    eAction.type === "Skill" &&
    isCounterSkill(eSkill) &&
    (pAction.type === "Strike" || (pAction.type === "Skill" && isAggressiveSkill(pSkill)))
  ) {
    resolveCounterVsAggression(
      resolution,
      enemyCard,
      playerCard,
      eAction,
      pAction,
      eSkill,
      pSkill,
    );
    return resolution;
  }

  if (pAction.type === "Skill" && eAction.type === "Guard") {
    if (isCounterSkill(pSkill)) {
      resolution.focusChanges.enemy += 1;
      resolution.logs.push("Counter skill finds no real opening into Guard.");
      return resolution;
    }

    const defenderSkill = isStanceSkill(eSkill) ? eSkill : null;

    resolveStrikeLikeSequence({
      resolution,
      attacker: playerCard,
      defender: enemyCard,
      attackerAction: pAction,
      defenderAction: eAction,
      attackerSkill: pSkill,
      defenderSkill,
      applyToSlot: enemyCard.slot,
    });

    if (resolution.winnerSide !== "player") {
      resolution.focusChanges.enemy += 1;
    }

    return resolution;
  }

  if (eAction.type === "Skill" && pAction.type === "Guard") {
    if (isCounterSkill(eSkill)) {
      resolution.focusChanges.player += 1;
      resolution.logs.push("Counter skill finds no real opening into Guard.");
      return resolution;
    }

    const defenderSkill = isStanceSkill(pSkill) ? pSkill : null;

    resolveStrikeLikeSequence({
      resolution,
      attacker: enemyCard,
      defender: playerCard,
      attackerAction: eAction,
      defenderAction: pAction,
      attackerSkill: eSkill,
      defenderSkill,
      applyToSlot: playerCard.slot,
    });

    if (resolution.winnerSide !== "enemy") {
      resolution.focusChanges.player += 1;
    }

    return resolution;
  }

  if (pAction.type === "Skill" && eAction.type === "Charge") {
    if (isCounterSkill(pSkill) || isStanceSkill(pSkill)) {
      resolution.logs.push("The skill does not convert well into a charging target.");
      return resolution;
    }

    resolveStrikeLikeSequence({
      resolution,
      attacker: playerCard,
      defender: enemyCard,
      attackerAction: pAction,
      defenderAction: eAction,
      attackerSkill: pSkill,
      defenderSkill: eSkill,
      applyToSlot: enemyCard.slot,
    });

    return resolution;
  }

  if (eAction.type === "Skill" && pAction.type === "Charge") {
    if (isCounterSkill(eSkill) || isStanceSkill(eSkill)) {
      resolution.logs.push("The skill does not convert well into a charging target.");
      return resolution;
    }

    resolveStrikeLikeSequence({
      resolution,
      attacker: enemyCard,
      defender: playerCard,
      attackerAction: eAction,
      defenderAction: pAction,
      attackerSkill: eSkill,
      defenderSkill: pSkill,
      applyToSlot: playerCard.slot,
    });

    return resolution;
  }

  if (pAction.type === "Skill" && eAction.type === "Switch") {
    if (isCounterSkill(pSkill)) {
      spendSwitchTempo(resolution, enemyTeam, eAction.targetReserveSlot!);
      resolution.logs.push("Counter skill loses value against a switch.");
      return resolution;
    }

    resolveSwitchVsStrikeLike({
      resolution,
      switchingTeam: enemyTeam,
      attackingTeam: playerTeam,
      switchAction: eAction,
      attackAction: pAction,
      attackSkill: pSkill,
      attackCard: playerCard,
      oldActive: enemyCard,
    });
    return resolution;
  }

  if (eAction.type === "Skill" && pAction.type === "Switch") {
    if (isCounterSkill(eSkill)) {
      spendSwitchTempo(resolution, playerTeam, pAction.targetReserveSlot!);
      resolution.logs.push("Counter skill loses value against a switch.");
      return resolution;
    }

    resolveSwitchVsStrikeLike({
      resolution,
      switchingTeam: playerTeam,
      attackingTeam: enemyTeam,
      switchAction: pAction,
      attackAction: eAction,
      attackSkill: eSkill,
      attackCard: enemyCard,
      oldActive: playerCard,
    });
    return resolution;
  }

  if (pAction.type === "Skill" && eAction.type === "Strike") {
    if (isStanceSkill(pSkill)) {
      resolveStrikeLikeSequence({
        resolution,
        attacker: enemyCard,
        defender: playerCard,
        attackerAction: eAction,
        defenderAction: pAction,
        attackerSkill: eSkill,
        defenderSkill: pSkill,
        applyToSlot: playerCard.slot,
      });
      return resolution;
    }

    if (isAggressiveSkill(pSkill)) {
      resolveStrikeVsStrike(
        resolution,
        playerCard,
        enemyCard,
        pAction,
        eAction,
        pSkill,
        eSkill,
      );
      return resolution;
    }
  }

  if (eAction.type === "Skill" && pAction.type === "Strike") {
    if (isStanceSkill(eSkill)) {
      resolveStrikeLikeSequence({
        resolution,
        attacker: playerCard,
        defender: enemyCard,
        attackerAction: pAction,
        defenderAction: eAction,
        attackerSkill: pSkill,
        defenderSkill: eSkill,
        applyToSlot: enemyCard.slot,
      });
      return resolution;
    }

    if (isAggressiveSkill(eSkill)) {
      resolveStrikeVsStrike(
        resolution,
        playerCard,
        enemyCard,
        pAction,
        eAction,
        pSkill,
        eSkill,
      );
      return resolution;
    }
  }

  if (pAction.type === "Skill" && eAction.type === "Skill") {
    if (isCounterSkill(pSkill) && isAggressiveSkill(eSkill)) {
      resolveCounterVsAggression(
        resolution,
        playerCard,
        enemyCard,
        pAction,
        eAction,
        pSkill,
        eSkill,
      );
      return resolution;
    }

    if (isCounterSkill(eSkill) && isAggressiveSkill(pSkill)) {
      resolveCounterVsAggression(
        resolution,
        enemyCard,
        playerCard,
        eAction,
        pAction,
        eSkill,
        pSkill,
      );
      return resolution;
    }

    resolveStrikeVsStrike(
      resolution,
      playerCard,
      enemyCard,
      pAction,
      eAction,
      pSkill,
      eSkill,
    );
    return resolution;
  }

  resolution.logs.push("Fallback resolution: no special branch matched.");
  return resolution;
}

export function getArenaClashResolvedFocusAfterExchange(
  currentFocus: number,
  delta: number,
): number {
  return clampArenaClashFocus(currentFocus + delta);
}