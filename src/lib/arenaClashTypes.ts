import type { FighterCard, FighterType, Rarity } from "@/types/game";

export type ArenaClashSide = "player" | "enemy";

export type ArenaClashCardState = "Ready" | "Pressured" | "Broken" | "KO";

export type ArenaClashActionType =
  | "Strike"
  | "Guard"
  | "Skill"
  | "Switch"
  | "Charge";

export type ArenaClashSkillType =
  | "Burst"
  | "Pierce"
  | "Counter"
  | "Stance"
  | "Control"
  | "Utility";

export type ArenaClashSkillWindow =
  | "OnReveal"
  | "BeforeClash"
  | "OnSpeed"
  | "OnEntry"
  | "OnPower"
  | "OnDefense"
  | "OnReversal"
  | "AfterWin"
  | "AfterLoss";

export type ArenaClashKind =
  | "None"
  | "SpeedClash"
  | "EntryClash"
  | "PowerClash"
  | "ReversalClash"
  | "SwitchCheck";

export type ArenaClashResultTier = "none" | "light" | "clean" | "crush";

export type ArenaClashStatusType =
  | "Strain"
  | "Bleed"
  | "Shield"
  | "Stun"
  | "GuardBreak"
  | "TempoDown";

export type ArenaClashStatKey = keyof FighterCard["stats"];

export type ArenaClashStatBlock = FighterCard["stats"];

export type ArenaClashFighterCard = FighterCard & {
  manualSkillKey?: string;
  arenaClashSkillKey?: string;
  tags?: string[];
};

export type ArenaClashActionSelection = {
  type: ArenaClashActionType;
  skillKey?: string;
  targetReserveSlot?: number;
};

export type ArenaClashStatusInstance = {
  type: ArenaClashStatusType;
  durationExchanges: number;
  stacks?: number;
  sourceCardId?: number;
};

export type ArenaClashSkillDefinition = {
  key: string;
  name: string;
  type: ArenaClashSkillType;

  focusCost: number;
  tempoCost?: number;

  cooldownExchanges?: number;
  oncePerFielding?: boolean;
  oncePerBattle?: boolean;

  allowedActions?: ArenaClashActionType[];
  allowedWindows: ArenaClashSkillWindow[];

  target: "self" | "enemy" | "self_or_enemy";

  modifiesClash?: ArenaClashKind[];

  flatBonuses?: Partial<ArenaClashStatBlock>;

  weightShift?: Partial<{
    speedSPD: number;
    speedINSTINCT: number;

    entrySPD: number;
    entryTECH: number;
    entryINSTINCT: number;
    entryDEF: number;

    powerSTR: number;
    powerTECH: number;
    powerDEF: number;
    powerDUR: number;

    reversalTECH: number;
    reversalINSTINCT: number;
    reversalSTR: number;
    reversalSPD: number;
  }>;

  ignoreDefensePercent?: number;
  ignoreDurabilityPercent?: number;
  ignoreInstinctPercent?: number;

  applyStatusesToSelf?: ArenaClashStatusType[];
  applyStatusesToEnemy?: ArenaClashStatusType[];

  resultShift?: {
    onWin?: -1 | 0 | 1;
    onLose?: -1 | 0 | 1;
  };

  description: string;
};

export type ArenaClashSkillRuntimeState = {
  cooldowns: Record<string, number>;
  usedThisFielding: Record<string, boolean>;
  usedThisBattle: Record<string, boolean>;
};

export type ArenaClashCardFlags = {
  isLead: boolean;
  hasEnteredField: boolean;
  switchedInThisRound: boolean;
  knockedOutBySwitchPunish: boolean;
};

export type ArenaClashBattleCardRuntime = {
  owner: ArenaClashSide;
  slot: number;

  card: ArenaClashFighterCard;
  fighterType: FighterType;
  rarity: Rarity;

  state: ArenaClashCardState;
  focus: number;

  statuses: ArenaClashStatusInstance[];
  skillState: ArenaClashSkillRuntimeState;

  guardStreak: number;
  chargeStreak: number;

  flags: ArenaClashCardFlags;
};

export type ArenaClashTeamState = {
  side: ArenaClashSide;
  tempo: number;
  activeSlot: number;
  fighters: ArenaClashBattleCardRuntime[];
};

export type ArenaClashPhase =
  | "setup"
  | "versus"
  | "choose-actions"
  | "resolve-exchange"
  | "round-end"
  | "match-end";

export type ArenaClashSnapshot = {
  kind: ArenaClashKind;
  attackerSide: ArenaClashSide;
  defenderSide: ArenaClashSide;
  attackerValue: number;
  defenderValue: number;
  difference: number;
  winnerSide: ArenaClashSide | "draw";
};

export type ArenaClashStateTransition = {
  side: ArenaClashSide;
  slot: number;
  from: ArenaClashCardState;
  to: ArenaClashCardState;
};

export type ArenaClashStatusApplication = {
  side: ArenaClashSide;
  slot: number;
  status: ArenaClashStatusType;
  applied: boolean;
};

export type ArenaClashExchangeResolution = {
  exchangeNumber: number;

  playerAction: ArenaClashActionSelection;
  enemyAction: ArenaClashActionSelection;

  primaryClash: ArenaClashKind;
  secondaryClash?: ArenaClashKind;

  resultTier: ArenaClashResultTier;
  winnerSide: ArenaClashSide | "draw" | "none";

  clashes: ArenaClashSnapshot[];
  stateTransitions: ArenaClashStateTransition[];
  statusApplications: ArenaClashStatusApplication[];

  focusChanges: {
    player: number;
    enemy: number;
  };

  tempoChanges: {
    player: number;
    enemy: number;
  };

  koOccurred: boolean;
  roundEnded: boolean;
  logs: string[];
};

export type ArenaClashRoundState = {
  roundNumber: number;
  startedAtExchange: number;
  activePlayerSlot: number;
  activeEnemySlot: number;
};

export type ArenaClashBattleResult = {
  winner: ArenaClashSide | null;
  loser: ArenaClashSide | null;
  reason:
    | "all_ko"
    | "no_tempo_to_field"
    | "surrender"
    | "unfinished";
};

export type ArenaClashMatchState = {
  mode: "arena-clash";

  phase: ArenaClashPhase;

  player: ArenaClashTeamState;
  enemy: ArenaClashTeamState;

  currentRound: ArenaClashRoundState;
  exchangeNumber: number;

  pendingPlayerAction: ArenaClashActionSelection | null;
  pendingEnemyAction: ArenaClashActionSelection | null;

  lastResolution: ArenaClashExchangeResolution | null;
  result: ArenaClashBattleResult | null;

  battleLog: string[];
};

export const ARENA_CLASH_MAX_TEMPO = 5;
export const ARENA_CLASH_STARTING_TEMPO = 2;
export const ARENA_CLASH_TEMPO_PER_NEW_ROUND = 1;

export const ARENA_CLASH_MAX_FOCUS = 4;
export const ARENA_CLASH_STARTING_FOCUS = 1;

export const ARENA_CLASH_GUARD_BONUS = {
  DEF: 12,
  DUR: 8,
  INSTINCT: 4,
} as const;

export const ARENA_CLASH_CHARGE_PENALTY = {
  DEF: -8,
  SPD: -6,
} as const;

export const ARENA_CLASH_PRESSURED_PENALTY = {
  SPD: -6,
  DEF: -6,
} as const;

export const ARENA_CLASH_BROKEN_PENALTY = {
  SPD: -10,
  DEF: -8,
} as const;

export const ARENA_CLASH_STRAIN_PENALTY = {
  STR: -6,
  DEF: -6,
} as const;

export const ARENA_CLASH_TEMPO_COST_BY_RARITY: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1,
  Rare: 1,
  Epic: 2,
  Elite: 2,
  Legendary: 3,
  "God-like": 4,
  Divine: 4,
};

export const ARENA_CLASH_RESULT_TIER_ORDER: ArenaClashResultTier[] = [
  "none",
  "light",
  "clean",
  "crush",
];

export function getArenaClashTempoCostByRarity(rarity: Rarity): number {
  return ARENA_CLASH_TEMPO_COST_BY_RARITY[rarity];
}

export function getArenaClashNextStateAfterTier(
  currentState: ArenaClashCardState,
  resultTier: ArenaClashResultTier,
): ArenaClashCardState {
  if (currentState === "KO" || resultTier === "none") {
    return currentState;
  }

  const steps =
    resultTier === "light" ? 1 : resultTier === "clean" ? 2 : 2;

  const stateOrder: ArenaClashCardState[] = ["Ready", "Pressured", "Broken", "KO"];
  const currentIndex = stateOrder.indexOf(currentState);

  if (currentIndex < 0) {
    return currentState;
  }

  if (resultTier === "crush") {
    if (currentState === "Ready") {
      return "Broken";
    }

    return "KO";
  }

  const nextIndex = Math.min(currentIndex + steps, stateOrder.length - 1);
  return stateOrder[nextIndex];
}

export function clampArenaClashFocus(value: number): number {
  return Math.max(0, Math.min(ARENA_CLASH_MAX_FOCUS, value));
}

export function clampArenaClashTempo(value: number): number {
  return Math.max(0, Math.min(ARENA_CLASH_MAX_TEMPO, value));
}

export function isArenaClashCardActive(
  card: ArenaClashBattleCardRuntime,
  team: ArenaClashTeamState,
): boolean {
  return team.fighters[team.activeSlot]?.card.id === card.card.id;
}

export function isArenaClashCardKO(card: ArenaClashBattleCardRuntime): boolean {
  return card.state === "KO";
}

export function canArenaClashCardStillFight(
  card: ArenaClashBattleCardRuntime,
): boolean {
  return card.state !== "KO";
}

export function getArenaClashActiveCard(
  team: ArenaClashTeamState,
): ArenaClashBattleCardRuntime {
  return team.fighters[team.activeSlot];
}

export function createArenaClashEmptySkillRuntimeState(): ArenaClashSkillRuntimeState {
  return {
    cooldowns: {},
    usedThisFielding: {},
    usedThisBattle: {},
  };
}

export function createArenaClashRuntimeCard(
  card: ArenaClashFighterCard,
  owner: ArenaClashSide,
  slot: number,
  isLead = false,
): ArenaClashBattleCardRuntime {
  return {
    owner,
    slot,
    card,
    fighterType: card.type,
    rarity: card.rarity,
    state: "Ready",
    focus: ARENA_CLASH_STARTING_FOCUS,
    statuses: [],
    skillState: createArenaClashEmptySkillRuntimeState(),
    guardStreak: 0,
    chargeStreak: 0,
    flags: {
      isLead,
      hasEnteredField: isLead,
      switchedInThisRound: false,
      knockedOutBySwitchPunish: false,
    },
  };
}

export function createArenaClashTeamState(
  side: ArenaClashSide,
  cards: ArenaClashFighterCard[],
): ArenaClashTeamState {
  return {
    side,
    tempo: ARENA_CLASH_STARTING_TEMPO,
    activeSlot: 0,
    fighters: cards.map((card, index) =>
      createArenaClashRuntimeCard(card, side, index, index === 0),
    ),
  };
}