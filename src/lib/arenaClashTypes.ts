import type { FighterCard } from "@/types/game";

export type ArenaClashSide = "player" | "enemy";

export type ArenaClashRow = "front" | "core" | "reserve";
export type ArenaClashDeployRow = Exclude<ArenaClashRow, "reserve">;

export type ArenaClashPhase =
  | "deploy"
  | "enemy-deploy"
  | "command"
  | "switch"
  | "guard-charge"
  | "strike"
  | "burst"
  | "break"
  | "support"
  | "finished";

export type ArenaClashActionType =
  | "Strike"
  | "Charge"
  | "Guard"
  | "Burst"
  | "Switch"
  | "Skill";

export type ArenaClashSkillType =
  | "Strike"
  | "Charge"
  | "Guard"
  | "Burst"
  | "Switch"
  | "Passive"
  | "Trigger";

export type ArenaClashTargetRule =
  | "self"
  | "ally"
  | "adjacent-ally"
  | "front-enemy"
  | "same-lane-enemy"
  | "any-enemy"
  | "broken-enemy"
  | "entry-slot"
  | "reserve-slot"
  | "global";

export type ArenaClashRoleTag =
  | "frontliner"
  | "tank"
  | "core-carry"
  | "tempo"
  | "counter"
  | "bruiser"
  | "controller"
  | "switch-specialist"
  | "support-friendly"
  | "burst-carry";

export type ArenaClashSupportTier = "standard" | "god-like";
export type ArenaClashSupportCategory =
  | "burst"
  | "aura"
  | "body-state"
  | "tactical";

export type ArenaClashPopupKind =
  | "action"
  | "result"
  | "state"
  | "special"
  | "resource";

export type ArenaClashStatusType =
  | "Stagger"
  | "GuardBoost"
  | "TempoLock"
  | "ForceBuff"
  | "PressureBuff"
  | "ReadBuff"
  | "BreakResist"
  | "DemonBack"
  | "CannotBurst"
  | "RecoveryLock";

export type ArenaClashStatKey =
  | "STR"
  | "SPD"
  | "TECH"
  | "DUR"
  | "DEF"
  | "INSTINCT";

export type ArenaClashStatBlock = Pick<
  FighterCard["stats"],
  "STR" | "SPD" | "TECH" | "DUR" | "DEF" | "INSTINCT"
>;

export type ArenaClashPopupDefinition = {
  text: string;
  kind: ArenaClashPopupKind;
  color: string;
  outline: string;
};

export type ArenaClashPopupEvent = {
  id: string;
  text: string;
  kind: ArenaClashPopupKind;
  color: string;
  outline: string;
  side?: ArenaClashSide;
  slotId?: ActiveBoardSlotId | null;
  sourceUnitUid?: string;
  targetUnitUid?: string;
  durationMs?: number;
};

export type ArenaClashRuntimeStatusInstance = {
  id: string;
  type: ArenaClashStatusType;
  remainingRounds: number;
  sourceId?: string;
  notes?: string;
};

export type ArenaClashSkillDefinition = {
  key: string;
  name: string;
  shortLabel: string;
  type: ArenaClashSkillType;

  tempoCost: number;
  forceCost?: number;
  storedForceCost?: number;

  cooldownRounds: number;
  oncePerMatch?: boolean;

  allowedRows: Array<ArenaClashRow | "any">;
  targetRule: ArenaClashTargetRule;

  statScaling: Partial<Record<ArenaClashStatKey, number>>;
  popupText: string;
  description: string;

  keywords?: string[];
  requiresBrokenTarget?: boolean;
  requiresFrontline?: boolean;
  onEntryOnly?: boolean;
  onSwitchOnly?: boolean;
};

export type ArenaClashSupportSynergyModifier = {
  strikePressurePct?: number;
  burstPressurePct?: number;
  guardValuePct?: number;
  breakThresholdPct?: number;
  readValueFlat?: number;
  chargeGainPct?: number;
  tempoCostReductionFlat?: number;
  ignoreFirstBreak?: boolean;
};

export type ArenaClashSupportCard = {
  id: string;
  name: string;
  tier: ArenaClashSupportTier;
  category: ArenaClashSupportCategory;

  storedForceCost: number;
  roundGate?: number;
  durationRounds?: number;
  oncePerMatch?: boolean;

  keywords?: string[];
  popupText: string;
  description: string;

  baseModifiers?: ArenaClashSupportSynergyModifier;
  synergyBySlug?: Record<string, ArenaClashSupportSynergyModifier>;
};

export type ArenaClashFighterProfile = {
  fighterId: number;
  slug: string;
  roleTags: ArenaClashRoleTag[];
  preferredRows: ArenaClashDeployRow[];
  signatureSkillKey: string;
  supportAffinityTags?: string[];
};

export const ARENA_CLASH_CONFIG = {
  deckSize: 10,

  frontSlots: 3,
  coreSlots: 4,
  reserveSlots: 3,
  maxActiveBoardUnits: 7,

  initialDeployCount: 5,
  minFrontlineOnInitialDeploy: 1,

  supportEquippedLimit: 2,
  godLikeSupportLimit: 1,
  supportActivationsPerRound: 1,

  storedForceCap: 3,
  teamSignatureLimitPerRound: 2,
  teamSwitchLimitPerRound: 1,

  switchStoredForceCost: 1,
  switchRecoveryLockRounds: 1,
  switchedInCannotBurstThisRound: true,

  defaultSignatureCooldown: 2,
  firstBreakStaggerRounds: 1,
  breakTokensToEliminate: 2,
} as const;

export const ACTIVE_BOARD_SLOTS = [
  { id: "front_left", row: "front", lane: 0, order: 0 },
  { id: "front_center", row: "front", lane: 1, order: 1 },
  { id: "front_right", row: "front", lane: 2, order: 2 },

  { id: "core_left", row: "core", lane: 0, order: 3 },
  { id: "core_center_left", row: "core", lane: 1, order: 4 },
  { id: "core_center_right", row: "core", lane: 2, order: 5 },
  { id: "core_right", row: "core", lane: 3, order: 6 },
] as const;

export type ActiveBoardSlotId = (typeof ACTIVE_BOARD_SLOTS)[number]["id"];

export type ArenaClashRuntimeUnit = {
  uid: string;
  side: ArenaClashSide;
  slotId: ActiveBoardSlotId | null;
  inReserve: boolean;

  fighterId: number;
  cardName: string;
  cardTitle: string;
  cardSlug: string;
  rarity: FighterCard["rarity"];
  stars: FighterCard["stars"];
  series?: "Baki" | "Kengan";

  stats: ArenaClashStatBlock;

  roleTags: ArenaClashRoleTag[];
  preferredRows: ArenaClashDeployRow[];
  signatureSkillKey: string;
  supportAffinityTags?: string[];

  force: number;
  forceCap: number;

  tempo: number;
  tempoCap: number;

  breakMeter: number;
  breakTokens: number;

  eliminated: boolean;
  staggerRoundsLeft: number;
  recoveryLockRounds: number;
  enteredThisRound: boolean;

  lastAction: ArenaClashActionType | null;
  lastPopup?: ArenaClashPopupDefinition | null;

  skillCooldownLeft: number;
  skillUsedThisMatch: boolean;

  statusEffects: ArenaClashRuntimeStatusInstance[];
};

export type ArenaClashBoardState = Partial<
  Record<ActiveBoardSlotId, ArenaClashRuntimeUnit>
>;

export type ArenaClashTeamState = {
  side: ArenaClashSide;

  active: ArenaClashBoardState;
  reserve: ArenaClashRuntimeUnit[];

  storedForce: number;

  supportLoadout: ArenaClashSupportCard[];

  switchesUsedThisRound: number;
  signaturesUsedThisRound: number;
  supportsUsedThisRound: number;
};

export type ArenaClashQueuedCommand = {
  unitUid: string;
  action: ArenaClashActionType;
  targetSlotId?: ActiveBoardSlotId;
  targetUnitUid?: string;
  chosenReserveUid?: string;
  chosenSupportId?: string;
  useSignature?: boolean;
};

export type ArenaClashFinishedReason =
  | "all_eliminated"
  | "collapse"
  | "surrender"
  | "unfinished";

export type ArenaClashMatchState = {
  mode: "arena-clash";

  phase: ArenaClashPhase;
  roundNumber: number;

  player: ArenaClashTeamState;
  enemy: ArenaClashTeamState;

  queuedPlayerCommands: ArenaClashQueuedCommand[];
  queuedEnemyCommands: ArenaClashQueuedCommand[];

  winner: ArenaClashSide | null;
  loser: ArenaClashSide | null;
  finishedReason: ArenaClashFinishedReason;

  battleLog: string[];
  popupQueue: ArenaClashPopupEvent[];
};

export type ArenaClashStoredSetup = {
  fighterDeckIds: number[];
  supportIds: string[];
  godLikeSupportId: string | null;

  enemyDeckIds?: number[] | null;

  savedAt: number;
  version: 2;
};

export type ArenaClashStoredRuntimeState = {
  state: ArenaClashMatchState;
  savedAt: number;
  version: 2;
};

export const ARENA_POPUPS = {
  action: {
    strike: {
      text: "STRIKE!",
      kind: "action",
      color: "#ff745c",
      outline: "#2b0c08",
    },
    charge: {
      text: "CHARGE!",
      kind: "action",
      color: "#ffb558",
      outline: "#2a1705",
    },
    guard: {
      text: "GUARD!",
      kind: "action",
      color: "#64cbff",
      outline: "#06192b",
    },
    burst: {
      text: "BURST!",
      kind: "action",
      color: "#d07cff",
      outline: "#22062b",
    },
    switch: {
      text: "SWITCH!",
      kind: "action",
      color: "#7affd4",
      outline: "#072822",
    },
    skill: {
      text: "SKILL!",
      kind: "special",
      color: "#ffd76b",
      outline: "#2a1e05",
    },
  },
  result: {
    block: {
      text: "BLOCK",
      kind: "result",
      color: "#63c7ff",
      outline: "#06182a",
    },
    read: {
      text: "READ!",
      kind: "result",
      color: "#b58cff",
      outline: "#18062a",
    },
    entry: {
      text: "ENTRY",
      kind: "result",
      color: "#7affd4",
      outline: "#072822",
    },
    intercept: {
      text: "INTERCEPT",
      kind: "result",
      color: "#63ffd0",
      outline: "#07231d",
    },
    pressure: {
      text: "PRESSURE",
      kind: "result",
      color: "#ff8759",
      outline: "#2b1008",
    },
  },
  state: {
    break: {
      text: "BREAK!",
      kind: "state",
      color: "#ff5454",
      outline: "#2a0505",
    },
    stagger: {
      text: "STAGGER",
      kind: "state",
      color: "#ff8d66",
      outline: "#2a1108",
    },
    frontDown: {
      text: "FRONT DOWN",
      kind: "state",
      color: "#ff5f6b",
      outline: "#2a0508",
    },
    coreOpen: {
      text: "CORE OPEN",
      kind: "state",
      color: "#ffb25f",
      outline: "#2a1705",
    },
  },
  special: {
    demonBack: {
      text: "DEMON BACK",
      kind: "special",
      color: "#ff9d50",
      outline: "#2b0f05",
    },
    godLike: {
      text: "GOD-LIKE",
      kind: "special",
      color: "#ffd86d",
      outline: "#2a1d05",
    },
  },
} as const;

export const ARENA_CLASH_NOTES = {
  combatIdentity:
    "Arena Clash has no HP. Fighters are broken by pressure, destabilized by read disadvantage, and eliminated through repeated Break states.",
  eliminationRule:
    "A fighter receives Break Tokens when their Break Meter overflows. First Break = stagger and vulnerability. Second Break = elimination.",
  switchRule:
    "One team-wide Switch per round. Costs 1 Stored Force. Switched-in fighter gets entry bonuses but cannot Burst immediately.",
  supportRule:
    "Each team equips 2 support cards max, including at most 1 God-like card. Only 1 support activation per round.",
  signatureRule:
    "Signature skills spend Tempo, may optionally spend Force, and are capped by cooldown plus team-wide per-round signature limits.",
} as const;