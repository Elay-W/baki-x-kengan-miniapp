export type BattleMode = "Ranked" | "Casual" | "Training";

export type CardState = "Ready" | "Pressured" | "Broken" | "KO";

export type StatusEffect =
  | "Strain"
  | "Bleed"
  | "Shield"
  | "Stun"
  | "TempoUp"
  | "TempoDown"
  | "GuardBreak"
  | "CounterReady"
  | "Focus";

export type BattleLogSide = "player" | "enemy";
export type ExchangeWinner = "player" | "enemy" | "draw";

export type FighterStats = {
  STR: number;
  SPD: number;
  TECH: number;
  DUR: number;
  DEF: number;
  INSTINCT: number;
};

export type ActiveStatus = {
  type: StatusEffect;
  stacks?: number;
  duration?: number;
  source?: string;
};

export type BattleCardRuntime<TCard = any> = {
  side: BattleLogSide;
  slot: number;
  card: TCard;
  currentState: CardState;
  statuses: ActiveStatus[];
  exchangesWon: number;
  exchangesLost: number;
  hasTriggeredPassive: Record<string, boolean>;
};

export type BattleExchangeLog = {
  round: number;
  exchange: number;
  attackerSide: BattleLogSide;
  defenderSide: BattleLogSide;
  attackerName: string;
  defenderName: string;
  initiativeScore: {
    player: number;
    enemy: number;
  };
  offenseScore: number;
  defenseScore: number;
  winner: ExchangeWinner;
  resultText: string;
  attackerStateAfter: CardState;
  defenderStateAfter: CardState;
  triggeredAbility?: string;
};

export type BattleKOLog = {
  round: number;
  side: BattleLogSide;
  name: string;
  defeatedBy: string;
};

export type BattleTimelineEvent =
  | {
      type: "exchange";
      payload: BattleExchangeLog;
    }
  | {
      type: "ko";
      payload: BattleKOLog;
    };

export type BattleSetupData<TCard = any> = {
  mode: BattleMode;
  playerDeck: TCard[];
  enemyDeck: TCard[];
};

export type BattleResultData<TCard = any> = {
  mode: BattleMode;
  winner: "player" | "enemy";
  rewardCoins: number;
  playerScore: number;
  enemyScore: number;
  mvp: TCard | null;
  playerDeck: TCard[];
  enemyDeck: TCard[];
  timeline: BattleTimelineEvent[];
  roundsPlayed: number;
  kos: {
    player: number;
    enemy: number;
  };
};