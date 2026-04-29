import { cards } from "@/data/cards";
import {
  getArenaClashFighterProfile,
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
  ArenaClashFighterProfile,
  ArenaClashMatchState,
  ArenaClashPhase,
  ArenaClashPopupDefinition,
  ArenaClashPopupEvent,
  ArenaClashRow,
  ArenaClashRuntimeStatusInstance,
  ArenaClashRuntimeUnit,
  ArenaClashSide,
  ArenaClashSkillDefinition,
  ArenaClashStatBlock,
  ArenaClashSupportCard,
  ArenaClashTeamState,
} from "@/lib/arenaClashTypes";
import type { FighterCard } from "@/types/game";

export function clamp(value: number, min = 0, max = 999999): number {
  return Math.max(min, Math.min(max, value));
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function getSlotMeta(slotId: ActiveBoardSlotId) {
  return ACTIVE_BOARD_SLOTS.find((slot) => slot.id === slotId)!;
}

export function isFrontSlot(slotId: ActiveBoardSlotId): boolean {
  return getSlotMeta(slotId).row === "front";
}

export function isCoreSlot(slotId: ActiveBoardSlotId): boolean {
  return getSlotMeta(slotId).row === "core";
}

export function getAllActiveSlotIds(): ActiveBoardSlotId[] {
  return ACTIVE_BOARD_SLOTS.map((slot) => slot.id);
}

export function buildArenaStatsFromCard(card: FighterCard): ArenaClashStatBlock {
  return {
    STR: card.stats.STR,
    SPD: card.stats.SPD,
    TECH: card.stats.TECH,
    DUR: card.stats.DUR,
    DEF: card.stats.DEF,
    INSTINCT: card.stats.INSTINCT,
  };
}

export function getBreakThreshold(stats: ArenaClashStatBlock): number {
  return round(
    30 +
      stats.DUR * 0.3 +
      stats.DEF * 0.22 +
      stats.INSTINCT * 0.16 +
      stats.TECH * 0.08 +
      stats.SPD * 0.04,
  );
}

export function getGuardValue(
  stats: ArenaClashStatBlock,
  isFrontline = false,
): number {
  const base =
    stats.DEF * 0.32 +
    stats.DUR * 0.16 +
    stats.TECH * 0.18 +
    stats.INSTINCT * 0.18 +
    stats.SPD * 0.06;

  return round(base * (isFrontline ? 1.2 : 1));
}

export function getChargeForceGain(stats: ArenaClashStatBlock): number {
  return round(
    8 +
      stats.SPD * 0.18 +
      stats.TECH * 0.16 +
      stats.INSTINCT * 0.2 +
      stats.DUR * 0.08 +
      stats.STR * 0.06,
  );
}

export function getChargeTempoGain(stats: ArenaClashStatBlock): number {
  return round(stats.SPD * 0.2 + stats.INSTINCT * 0.18 + stats.TECH * 0.1);
}

export function getForceCap(stats: ArenaClashStatBlock): number {
  return round(
    20 +
      stats.STR * 0.22 +
      stats.TECH * 0.1 +
      stats.DUR * 0.06 +
      stats.INSTINCT * 0.08,
  );
}

export function getTempoCap(stats: ArenaClashStatBlock): number {
  return round(
    20 +
      stats.SPD * 0.24 +
      stats.INSTINCT * 0.2 +
      stats.TECH * 0.12 +
      stats.STR * 0.04,
  );
}

export function getReadValue(stats: ArenaClashStatBlock): number {
  return round(
    stats.INSTINCT * 0.34 +
      stats.SPD * 0.16 +
      stats.TECH * 0.14 +
      stats.DEF * 0.06,
  );
}

export function getSupportEfficiency(stats: ArenaClashStatBlock): number {
  return round(
    stats.TECH * 0.28 +
      stats.INSTINCT * 0.3 +
      stats.DUR * 0.08 +
      stats.DEF * 0.08,
  );
}

export function getStrikePressure(
  stats: ArenaClashStatBlock,
  spentForce: number,
): number {
  return round(
    stats.STR * 0.3 +
      stats.SPD * 0.1 +
      stats.TECH * 0.18 +
      stats.INSTINCT * 0.18 +
      stats.DUR * 0.02 +
      stats.DEF * 0.02 +
      spentForce * 1.0,
  );
}

export function getBurstPressure(
  stats: ArenaClashStatBlock,
  spentForce: number,
): number {
  return round(
    stats.STR * 0.26 +
      stats.SPD * 0.12 +
      stats.TECH * 0.22 +
      stats.INSTINCT * 0.22 +
      stats.DUR * 0.02 +
      stats.DEF * 0.01 +
      spentForce * 1.35,
  );
}

export function getReadAdvantageBonus(
  attacker: ArenaClashStatBlock,
  defender: ArenaClashStatBlock,
): number {
  const diff = getReadValue(attacker) - getReadValue(defender);

  if (diff >= 20) return 0.18;
  if (diff >= 12) return 0.1;
  if (diff >= 6) return 0.05;
  if (diff <= -20) return -0.15;
  if (diff <= -12) return -0.08;
  if (diff <= -6) return -0.04;

  return 0;
}

export function getEffectivePressure(params: {
  attackerStats: ArenaClashStatBlock;
  defenderStats: ArenaClashStatBlock;
  action: "Strike" | "Burst";
  spentForce: number;
  targetIsGuarding: boolean;
  targetIsFrontline: boolean;
  flatGuardBonus?: number;
  flatReadBonusPct?: number;
}): number {
  const base =
    params.action === "Burst"
      ? getBurstPressure(params.attackerStats, params.spentForce)
      : getStrikePressure(params.attackerStats, params.spentForce);

  const readBonusPct =
    getReadAdvantageBonus(params.attackerStats, params.defenderStats) +
    (params.flatReadBonusPct ?? 0);

  const guardResponse = params.targetIsGuarding
    ? getGuardValue(params.defenderStats, params.targetIsFrontline) +
      (params.flatGuardBonus ?? 0)
    : 0;

  const pressureAfterRead = base * (1 + readBonusPct);
  return round(Math.max(0, pressureAfterRead - guardResponse));
}

export function applyPressureToBreakMeter(params: {
  currentBreakMeter: number;
  currentBreakTokens: number;
  breakThreshold: number;
  pressure: number;
}) {
  const threshold = Math.max(1, params.breakThreshold);
  const gainPercent = (params.pressure / threshold) * 100;

  let nextBreakMeter = params.currentBreakMeter + gainPercent;
  let nextBreakTokens = params.currentBreakTokens;
  let broke = false;
  let eliminated = false;

  while (nextBreakMeter >= 100) {
    nextBreakMeter -= 100;
    nextBreakTokens += 1;
    broke = true;

    if (nextBreakTokens >= ARENA_CLASH_CONFIG.breakTokensToEliminate) {
      eliminated = true;
      nextBreakMeter = 100;
      break;
    }
  }

  return {
    gainPercent: round(gainPercent),
    nextBreakMeter: round(clamp(nextBreakMeter, 0, 100)),
    nextBreakTokens,
    broke,
    eliminated,
  };
}

export function getSwitchEntryBonuses(stats: ArenaClashStatBlock) {
  return {
    tempoBonus: round(stats.SPD * 0.1 + stats.INSTINCT * 0.14),
    guardBonus: round(stats.DEF * 0.08 + stats.TECH * 0.06),
    readBonus: round(stats.INSTINCT * 0.1),
  };
}

export function createArenaPopupEvent(params: {
  text: string;
  kind: ArenaClashPopupEvent["kind"];
  color: string;
  outline: string;
  side?: ArenaClashSide;
  slotId?: ActiveBoardSlotId | null;
  sourceUnitUid?: string;
  targetUnitUid?: string;
  durationMs?: number;
}): ArenaClashPopupEvent {
  return {
    id: `popup_${Math.random().toString(36).slice(2, 10)}`,
    durationMs: 900,
    ...params,
  };
}

export function createPopupFromDefinition(
  definition: ArenaClashPopupDefinition,
  params?: Partial<
    Omit<
      ArenaClashPopupEvent,
      "id" | "text" | "kind" | "color" | "outline"
    >
  >,
): ArenaClashPopupEvent {
  return createArenaPopupEvent({
    text: definition.text,
    kind: definition.kind,
    color: definition.color,
    outline: definition.outline,
    ...params,
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function deriveCardSlug(card: FighterCard): string {
  const maybeSlug = (card as FighterCard & { slug?: string }).slug;
  return maybeSlug && maybeSlug.trim() ? maybeSlug : slugify(card.name);
}

function deriveCardSeries(card: FighterCard): "Baki" | "Kengan" | undefined {
  const maybeSeries = (card as FighterCard & { series?: string }).series;
  if (maybeSeries === "Baki" || maybeSeries === "Kengan") return maybeSeries;

  const maybeUniverse = (card as FighterCard & { universe?: string }).universe;
  if (maybeUniverse === "Baki" || maybeUniverse === "Kengan") return maybeUniverse;

  return undefined;
}

function derivePreferredRowsFromStats(
  stats: ArenaClashStatBlock,
): ArenaClashDeployRow[] {
  const frontScore =
    stats.DEF * 0.34 + stats.DUR * 0.26 + stats.INSTINCT * 0.12;
  const coreScore =
    stats.STR * 0.22 +
    stats.TECH * 0.22 +
    stats.SPD * 0.16 +
    stats.INSTINCT * 0.12;

  if (frontScore > coreScore + 4) return ["front"];
  if (coreScore > frontScore + 4) return ["core"];
  return ["front", "core"];
}

function deriveFallbackRoleTags(
  stats: ArenaClashStatBlock,
): ArenaClashFighterProfile["roleTags"] {
  const tags: ArenaClashFighterProfile["roleTags"] = [];

  if (stats.DEF >= 85 || stats.DUR >= 88) tags.push("frontliner");
  if (stats.DEF >= 90 && stats.DUR >= 90) tags.push("tank");
  if (stats.STR >= 90) tags.push("bruiser");
  if (stats.SPD >= 90) tags.push("tempo");
  if (stats.TECH >= 90 || stats.INSTINCT >= 92) tags.push("counter");
  if (stats.STR >= 90 && stats.TECH >= 88) tags.push("burst-carry");
  if (stats.TECH >= 90 && stats.INSTINCT >= 90) tags.push("controller");
  if (stats.INSTINCT >= 94 && stats.SPD >= 90) tags.push("switch-specialist");
  if (stats.TECH >= 88 && stats.INSTINCT >= 86) tags.push("support-friendly");
  if (stats.STR >= 88 && stats.SPD >= 84) tags.push("core-carry");

  return tags.length > 0 ? tags : ["core-carry"];
}

function buildFallbackFighterProfile(card: FighterCard): ArenaClashFighterProfile {
  const stats = buildArenaStatsFromCard(card);

  return {
    fighterId: card.id,
    slug: deriveCardSlug(card),
    roleTags: deriveFallbackRoleTags(stats),
    preferredRows: derivePreferredRowsFromStats(stats),
    signatureSkillKey: "",
    supportAffinityTags: [],
  };
}

export function cloneRuntimeStatus(
  status: ArenaClashRuntimeStatusInstance,
): ArenaClashRuntimeStatusInstance {
  return { ...status };
}

export function cloneRuntimeUnit(
  unit: ArenaClashRuntimeUnit,
): ArenaClashRuntimeUnit {
  return {
    ...unit,
    stats: { ...unit.stats },
    roleTags: [...unit.roleTags],
    preferredRows: [...unit.preferredRows],
    supportAffinityTags: unit.supportAffinityTags
      ? [...unit.supportAffinityTags]
      : undefined,
    statusEffects: unit.statusEffects.map(cloneRuntimeStatus),
    lastPopup: unit.lastPopup ? { ...unit.lastPopup } : null,
  };
}

export function cloneTeamState(
  team: ArenaClashTeamState,
): ArenaClashTeamState {
  const nextActive: ArenaClashTeamState["active"] = {};

  for (const slotId of Object.keys(team.active) as ActiveBoardSlotId[]) {
    const unit = team.active[slotId];
    if (unit) nextActive[slotId] = cloneRuntimeUnit(unit);
  }

  return {
    ...team,
    active: nextActive,
    reserve: team.reserve.map(cloneRuntimeUnit),
    supportLoadout: team.supportLoadout.map((support) => ({
      ...support,
      baseModifiers: support.baseModifiers
        ? { ...support.baseModifiers }
        : undefined,
      synergyBySlug: support.synergyBySlug
        ? Object.fromEntries(
            Object.entries(support.synergyBySlug).map(([key, value]) => [
              key,
              { ...value },
            ]),
          )
        : undefined,
      keywords: support.keywords ? [...support.keywords] : undefined,
    })),
  };
}

export function cloneMatchState(
  state: ArenaClashMatchState,
): ArenaClashMatchState {
  return {
    ...state,
    player: cloneTeamState(state.player),
    enemy: cloneTeamState(state.enemy),
    queuedPlayerCommands: state.queuedPlayerCommands.map((item) => ({ ...item })),
    queuedEnemyCommands: state.queuedEnemyCommands.map((item) => ({ ...item })),
    battleLog: [...state.battleLog],
    popupQueue: state.popupQueue.map((item) => ({ ...item })),
  };
}

export function getTeam(
  state: ArenaClashMatchState,
  side: ArenaClashSide,
): ArenaClashTeamState {
  return side === "player" ? state.player : state.enemy;
}

export function getOpponentTeam(
  state: ArenaClashMatchState,
  side: ArenaClashSide,
): ArenaClashTeamState {
  return side === "player" ? state.enemy : state.player;
}

export function getUnitAtSlot(
  team: ArenaClashTeamState,
  slotId: ActiveBoardSlotId,
): ArenaClashRuntimeUnit | null {
  return team.active[slotId] ?? null;
}

export function getUnitsInSlotOrder(
  team: ArenaClashTeamState,
): ArenaClashRuntimeUnit[] {
  return ACTIVE_BOARD_SLOTS.map((slot) => team.active[slot.id]).filter(
    (unit): unit is ArenaClashRuntimeUnit => Boolean(unit),
  );
}

export function getLivingActiveUnits(
  team: ArenaClashTeamState,
): ArenaClashRuntimeUnit[] {
  return getUnitsInSlotOrder(team).filter((unit) => !unit.eliminated);
}

export function getLivingReserveUnits(
  team: ArenaClashTeamState,
): ArenaClashRuntimeUnit[] {
  return team.reserve.filter((unit) => !unit.eliminated);
}

export function countLivingUnits(team: ArenaClashTeamState): number {
  return getLivingActiveUnits(team).length + getLivingReserveUnits(team).length;
}

export function hasLivingFrontline(team: ArenaClashTeamState): boolean {
  return ACTIVE_BOARD_SLOTS.some((slot) => {
    if (slot.row !== "front") return false;
    const unit = team.active[slot.id];
    return Boolean(unit && !unit.eliminated);
  });
}

export function hasLivingCore(team: ArenaClashTeamState): boolean {
  return ACTIVE_BOARD_SLOTS.some((slot) => {
    if (slot.row !== "core") return false;
    const unit = team.active[slot.id];
    return Boolean(unit && !unit.eliminated);
  });
}

export function findFirstEmptySlot(
  team: ArenaClashTeamState,
  row: ArenaClashDeployRow,
): ActiveBoardSlotId | null {
  const slot = ACTIVE_BOARD_SLOTS.find(
    (entry) => entry.row === row && !team.active[entry.id],
  );
  return slot?.id ?? null;
}

export function findFirstEmptyPreferredSlot(
  team: ArenaClashTeamState,
  preferredRows: ArenaClashDeployRow[],
): ActiveBoardSlotId | null {
  for (const row of preferredRows) {
    const slotId = findFirstEmptySlot(team, row);
    if (slotId) return slotId;
  }

  return findFirstEmptySlot(team, "front") ?? findFirstEmptySlot(team, "core");
}

export function hasStatus(
  unit: ArenaClashRuntimeUnit,
  statusType: ArenaClashRuntimeStatusInstance["type"],
): boolean {
  return unit.statusEffects.some((status) => status.type === statusType);
}

export function addStatus(
  unit: ArenaClashRuntimeUnit,
  status: ArenaClashRuntimeStatusInstance,
): ArenaClashRuntimeUnit {
  const existing = unit.statusEffects.find((item) => item.type === status.type);

  if (existing) {
    existing.remainingRounds = Math.max(
      existing.remainingRounds,
      status.remainingRounds,
    );
    return unit;
  }

  unit.statusEffects.push(status);
  return unit;
}

export function tickUnitStatuses(unit: ArenaClashRuntimeUnit) {
  unit.statusEffects = unit.statusEffects
    .map((status) => ({
      ...status,
      remainingRounds: status.remainingRounds - 1,
    }))
    .filter((status) => status.remainingRounds > 0);

  unit.staggerRoundsLeft = Math.max(0, unit.staggerRoundsLeft - 1);
  unit.recoveryLockRounds = Math.max(0, unit.recoveryLockRounds - 1);
  unit.skillCooldownLeft = Math.max(0, unit.skillCooldownLeft - 1);
  unit.enteredThisRound = false;
}

export function resetTeamRoundCounters(team: ArenaClashTeamState) {
  team.switchesUsedThisRound = 0;
  team.signaturesUsedThisRound = 0;
  team.supportsUsedThisRound = 0;
}

export function tickTeamForNewRound(team: ArenaClashTeamState) {
  resetTeamRoundCounters(team);

  for (const unit of getUnitsInSlotOrder(team)) {
    tickUnitStatuses(unit);
  }

  for (const unit of team.reserve) {
    tickUnitStatuses(unit);
  }
}

export function applyUnitForceDelta(
  unit: ArenaClashRuntimeUnit,
  delta: number,
): ArenaClashRuntimeUnit {
  unit.force = clamp(unit.force + delta, 0, unit.forceCap);
  return unit;
}

export function applyUnitTempoDelta(
  unit: ArenaClashRuntimeUnit,
  delta: number,
): ArenaClashRuntimeUnit {
  unit.tempo = clamp(unit.tempo + delta, 0, unit.tempoCap);
  return unit;
}

export function applyTeamStoredForceDelta(
  team: ArenaClashTeamState,
  delta: number,
): ArenaClashTeamState {
  team.storedForce = clamp(
    team.storedForce + delta,
    0,
    ARENA_CLASH_CONFIG.storedForceCap,
  );
  return team;
}

export function spendTeamStoredForce(
  team: ArenaClashTeamState,
  amount: number,
): boolean {
  if (team.storedForce < amount) return false;
  team.storedForce -= amount;
  return true;
}

export function canBurstThisRound(unit: ArenaClashRuntimeUnit): boolean {
  if (unit.eliminated) return false;
  if (unit.staggerRoundsLeft > 0) return false;
  if (
    unit.enteredThisRound &&
    ARENA_CLASH_CONFIG.switchedInCannotBurstThisRound
  ) {
    return false;
  }
  if (hasStatus(unit, "CannotBurst")) return false;

  return true;
}

export function canUseSignatureSkill(params: {
  unit: ArenaClashRuntimeUnit;
  currentRow: ArenaClashRow;
  phase: ArenaClashPhase;
  teamSignaturesUsedThisRound: number;
}): boolean {
  const skill = getArenaClashSkill(params.unit.signatureSkillKey);

  if (!skill) return false;
  if (params.unit.eliminated) return false;
  if (params.unit.staggerRoundsLeft > 0) return false;
  if (params.unit.skillCooldownLeft > 0) return false;
  if (skill.oncePerMatch && params.unit.skillUsedThisMatch) return false;
  if (
    params.teamSignaturesUsedThisRound >=
    ARENA_CLASH_CONFIG.teamSignatureLimitPerRound
  ) {
    return false;
  }
  if (
    !skill.allowedRows.includes("any") &&
    !skill.allowedRows.includes(params.currentRow)
  ) {
    return false;
  }
  if (params.unit.tempo < skill.tempoCost) return false;
  if ((skill.forceCost ?? 0) > params.unit.force) return false;
  if (params.phase === "deploy" || params.phase === "enemy-deploy") return false;
  if (params.phase === "finished") return false;

  if (params.unit.enteredThisRound && !skill.onEntryOnly) {
    return false;
  }

  if (skill.type === "Burst" && !canBurstThisRound(params.unit)) {
    return false;
  }

  return true;
}

export function canUseSwitch(params: {
  team: ArenaClashTeamState;
  unit: ArenaClashRuntimeUnit;
}): boolean {
  if (params.unit.eliminated) return false;
  if (params.unit.staggerRoundsLeft > 0) return false;
  if (params.unit.recoveryLockRounds > 0) return false;
  if (params.team.reserve.every((unit) => unit.eliminated)) return false;
  if (
    params.team.switchesUsedThisRound >=
    ARENA_CLASH_CONFIG.teamSwitchLimitPerRound
  ) {
    return false;
  }
  if (
    params.team.storedForce < ARENA_CLASH_CONFIG.switchStoredForceCost
  ) {
    return false;
  }

  return true;
}

export function canUseSupport(params: {
  team: ArenaClashTeamState;
  support: ArenaClashSupportCard;
  currentRound: number;
}): boolean {
  if (
    params.team.supportsUsedThisRound >=
    ARENA_CLASH_CONFIG.supportActivationsPerRound
  ) {
    return false;
  }
  if (params.team.storedForce < params.support.storedForceCost) return false;
  if (
    typeof params.support.roundGate === "number" &&
    params.currentRound < params.support.roundGate
  ) {
    return false;
  }

  return true;
}

export function buildArenaClashRuntimeUnit(
  card: FighterCard,
  side: ArenaClashSide,
  slotId: ActiveBoardSlotId | null,
  inReserve = false,
): ArenaClashRuntimeUnit {
  const profile = getArenaClashFighterProfile(card.id) ?? buildFallbackFighterProfile(card);
  const stats = buildArenaStatsFromCard(card);

  return {
    uid: `${side}_${card.id}_${slotId ?? "reserve"}_${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    side,
    slotId,
    inReserve,

    fighterId: card.id,
    cardName: card.name,
    cardTitle: card.title,
    cardSlug: profile.slug || deriveCardSlug(card),
    rarity: card.rarity,
    stars: card.stars,
    series: deriveCardSeries(card),

    stats,

    roleTags: [...profile.roleTags],
    preferredRows: [...profile.preferredRows],
    signatureSkillKey: profile.signatureSkillKey,
    supportAffinityTags: profile.supportAffinityTags
      ? [...profile.supportAffinityTags]
      : undefined,

    force: 0,
    forceCap: getForceCap(stats),

    tempo: 0,
    tempoCap: getTempoCap(stats),

    breakMeter: 0,
    breakTokens: 0,

    eliminated: false,
    staggerRoundsLeft: 0,
    recoveryLockRounds: 0,
    enteredThisRound: false,

    lastAction: null,
    lastPopup: null,

    skillCooldownLeft: 0,
    skillUsedThisMatch: false,

    statusEffects: [],
  };
}

export function buildArenaClashTeamState(params: {
  side: ArenaClashSide;
  deckCardIds: number[];
  supportIds?: string[];
}): ArenaClashTeamState {
  const uniqueDeckIds = Array.from(new Set(params.deckCardIds)).slice(
    0,
    ARENA_CLASH_CONFIG.deckSize,
  );

  const deckCards = uniqueDeckIds
    .map((id) => cards.find((card) => card.id === id))
    .filter((card): card is FighterCard => Boolean(card));

  if (deckCards.length === 0) {
    throw new Error(`Arena Clash ${params.side} deck cannot be empty.`);
  }

  const reserve = deckCards.map((card) =>
    buildArenaClashRuntimeUnit(card, params.side, null, true),
  );

  const supportLoadout = (params.supportIds ?? [])
    .map((id) => getArenaClashSupport(id))
    .filter((item): item is ArenaClashSupportCard => Boolean(item))
    .slice(0, ARENA_CLASH_CONFIG.supportEquippedLimit);

  return {
    side: params.side,
    active: {},
    reserve,
    storedForce: 0,
    supportLoadout,
    switchesUsedThisRound: 0,
    signaturesUsedThisRound: 0,
    supportsUsedThisRound: 0,
  };
}

export function buildArenaClashMatchState(params: {
  playerDeckIds: number[];
  enemyDeckIds: number[];
  playerSupportIds?: string[];
  enemySupportIds?: string[];
}): ArenaClashMatchState {
  const player = buildArenaClashTeamState({
    side: "player",
    deckCardIds: params.playerDeckIds,
    supportIds: params.playerSupportIds ?? [],
  });

  const enemy = buildArenaClashTeamState({
    side: "enemy",
    deckCardIds: params.enemyDeckIds,
    supportIds: params.enemySupportIds ?? [],
  });

  return {
    mode: "arena-clash",
    phase: "deploy",
    roundNumber: 1,

    player,
    enemy,

    queuedPlayerCommands: [],
    queuedEnemyCommands: [],

    winner: null,
    loser: null,
    finishedReason: "unfinished",

    battleLog: ["Arena Crash initialized."],
    popupQueue: [],
  };
}

export function moveReserveUnitToSlot(params: {
  team: ArenaClashTeamState;
  reserveUid: string;
  slotId: ActiveBoardSlotId;
}): ArenaClashRuntimeUnit | null {
  const reserveIndex = params.team.reserve.findIndex(
    (unit) => unit.uid === params.reserveUid && !unit.eliminated,
  );
  if (reserveIndex === -1) return null;
  if (params.team.active[params.slotId]) return null;

  const reserveUnit = params.team.reserve[reserveIndex];
  const placed = cloneRuntimeUnit(reserveUnit);

  placed.slotId = params.slotId;
  placed.inReserve = false;
  placed.enteredThisRound = true;
  placed.recoveryLockRounds = 0;
  placed.lastPopup = ARENA_POPUPS.result.entry;

  params.team.reserve.splice(reserveIndex, 1);
  params.team.active[params.slotId] = placed;

  return placed;
}

export function moveActiveUnitToReserve(params: {
  team: ArenaClashTeamState;
  slotId: ActiveBoardSlotId;
}): ArenaClashRuntimeUnit | null {
  const current = params.team.active[params.slotId];
  if (!current) return null;

  const moved = cloneRuntimeUnit(current);
  moved.slotId = null;
  moved.inReserve = true;
  moved.enteredThisRound = false;
  moved.recoveryLockRounds = ARENA_CLASH_CONFIG.switchRecoveryLockRounds;

  delete params.team.active[params.slotId];
  params.team.reserve.push(moved);

  return moved;
}

export function removeEliminatedFromReserve(team: ArenaClashTeamState) {
  team.reserve = team.reserve.filter((unit) => !unit.eliminated);
}

export function getCardById(cardId: number): FighterCard | null {
  return cards.find((card) => card.id === cardId) ?? null;
}

export function getAliveUnitCountOnBoard(team: ArenaClashTeamState): number {
  return getUnitsInSlotOrder(team).filter((unit) => !unit.eliminated).length;
}

export function getAliveUnitCountTotal(team: ArenaClashTeamState): number {
  return countLivingUnits(team);
}

export function setUnitLastAction(
  unit: ArenaClashRuntimeUnit,
  action: ArenaClashActionType | null,
) {
  unit.lastAction = action;
}

export function setUnitLastPopup(
  unit: ArenaClashRuntimeUnit,
  popup: ArenaClashPopupDefinition | null,
) {
  unit.lastPopup = popup;
}

export function markSkillUsage(
  unit: ArenaClashRuntimeUnit,
  skill: ArenaClashSkillDefinition,
) {
  unit.skillUsedThisMatch = true;
  unit.skillCooldownLeft = Math.max(
    unit.skillCooldownLeft,
    skill.cooldownRounds ?? ARENA_CLASH_CONFIG.defaultSignatureCooldown,
  );
  unit.tempo = clamp(unit.tempo - skill.tempoCost, 0, unit.tempoCap);

  if (skill.forceCost) {
    unit.force = clamp(unit.force - skill.forceCost, 0, unit.forceCap);
  }
}
