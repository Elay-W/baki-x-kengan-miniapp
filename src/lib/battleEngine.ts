import type { FighterCard } from "@/types/game";
import {
  applyStatuses,
  clearStun,
  consumeShield,
  getAbilityModifier,
  hasImmediateShield,
  hasStun,
  tickStatuses,
} from "@/lib/battleAbilities";
import type {
  BattleCardRuntime,
  BattleExchangeLog,
  BattleMode,
  BattleResultData,
  CardState,
  FighterStats,
} from "@/lib/battleTypes";

function cloneStats(stats: FighterStats): FighterStats {
  return {
    STR: stats.STR,
    SPD: stats.SPD,
    TECH: stats.TECH,
    DUR: stats.DUR,
    DEF: stats.DEF,
    INSTINCT: stats.INSTINCT,
  };
}

function seededNoise(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

function stateStepDown(current: CardState, shielded: boolean): CardState {
  if (shielded) {
    if (current === "Broken") return "Pressured";
    if (current === "Pressured") return "Ready";
    return "Ready";
  }

  if (current === "Ready") return "Pressured";
  if (current === "Pressured") return "Broken";
  if (current === "Broken") return "KO";
  return "KO";
}

function applyStateOutcome(
  target: BattleCardRuntime<FighterCard>,
  tier: "light" | "heavy" | "crushing"
) {
  const shielded = hasImmediateShield(target);
  if (shielded) {
    consumeShield(target);
  }

  if (tier === "light") {
    target.currentState = stateStepDown(target.currentState, shielded);
    return;
  }

  if (tier === "heavy") {
    const firstStep = stateStepDown(target.currentState, shielded);
    target.currentState = stateStepDown(firstStep, false);
    return;
  }

  target.currentState = "KO";
}

function determineExchangeTier(diff: number): "light" | "heavy" | "crushing" {
  if (diff >= 22) return "crushing";
  if (diff >= 10) return "heavy";
  return "light";
}

function getRewardCoins(mode: BattleMode, winner: "player" | "enemy") {
  const base = mode === "Ranked" ? 80 : mode === "Casual" ? 50 : 25;
  return winner === "player" ? base : -Math.round(base * 0.45);
}

function makeRuntimeDeck(
  side: "player" | "enemy",
  deck: FighterCard[]
): BattleCardRuntime<FighterCard>[] {
  return deck.map((card, index) => ({
    side,
    slot: index,
    card,
    currentState: "Ready",
    statuses: [],
    exchangesWon: 0,
    exchangesLost: 0,
    hasTriggeredPassive: {},
  }));
}

function getActiveIndex(deck: BattleCardRuntime<FighterCard>[]) {
  return deck.findIndex((item) => item.currentState !== "KO");
}

function computeInitiativeScore(
  actor: BattleCardRuntime<FighterCard>,
  defender: BattleCardRuntime<FighterCard>,
  exchangeSeed: number
) {
  const mod = getAbilityModifier({
    attacker: actor,
    defender,
  });

  let score =
    actor.card.stats.SPD * 0.6 +
    actor.card.stats.INSTINCT * 0.4 +
    seededNoise(exchangeSeed) * 6;

  if (actor.card.type === "Speedster") score += 6;
  if (hasStun(actor)) score -= 20;
  if (mod.initiativeBonus) score += mod.initiativeBonus;

  return score;
}

function computeEntryScore(
  attacker: BattleCardRuntime<FighterCard>,
  defender: BattleCardRuntime<FighterCard>,
  exchangeSeed: number
) {
  const mod = getAbilityModifier({
    attacker,
    defender,
  });

  let score =
    attacker.card.stats.SPD * 0.35 +
    attacker.card.stats.TECH * 0.25 +
    attacker.card.stats.INSTINCT * 0.4 +
    seededNoise(exchangeSeed) * 5;

  if (mod.initiativeBonus) score += mod.initiativeBonus * 0.5;
  if (mod.offenseBonus) score += mod.offenseBonus * 0.25;

  return score;
}

function computeReadScore(
  defender: BattleCardRuntime<FighterCard>,
  attacker: BattleCardRuntime<FighterCard>,
  exchangeSeed: number
) {
  const mod = getAbilityModifier({
    attacker: defender,
    defender: attacker,
  });

  let score =
    defender.card.stats.SPD * 0.25 +
    defender.card.stats.DEF * 0.25 +
    defender.card.stats.INSTINCT * 0.5 +
    seededNoise(exchangeSeed) * 5;

  if (mod.defenseBonus) score += mod.defenseBonus * 0.35;

  return score;
}

function computeAttackPower(
  attacker: BattleCardRuntime<FighterCard>,
  defender: BattleCardRuntime<FighterCard>,
  exchangeSeed: number
) {
  const mod = getAbilityModifier({
    attacker,
    defender,
  });

  let score =
    attacker.card.stats.STR * 0.6 +
    attacker.card.stats.TECH * 0.4 +
    seededNoise(exchangeSeed) * 5;

  if (attacker.card.type === "Powerhouse") score += 6;
  if (attacker.card.type === "Technician") score += 4;
  if (mod.offenseBonus) score += mod.offenseBonus;

  return score;
}

function computeGuardPower(
  defender: BattleCardRuntime<FighterCard>,
  attacker: BattleCardRuntime<FighterCard>,
  exchangeSeed: number
) {
  const mod = getAbilityModifier({
    attacker: defender,
    defender: attacker,
  });

  let score =
    defender.card.stats.DEF * 0.55 +
    defender.card.stats.DUR * 0.45 +
    seededNoise(exchangeSeed) * 5;

  if (defender.card.type === "Tank") score += 8;
  if (mod.defenseBonus) score += mod.defenseBonus;

  return score;
}

function scoreDeck(deck: BattleCardRuntime<FighterCard>[]) {
  return deck.reduce((sum, card) => {
    if (card.currentState === "KO") return sum;
    if (card.currentState === "Broken") return sum + 1;
    if (card.currentState === "Pressured") return sum + 2;
    return sum + 3;
  }, 0);
}

function getMvp(
  allCards: BattleCardRuntime<FighterCard>[],
  winner: "player" | "enemy"
): FighterCard | null {
  const filtered = allCards.filter((card) => card.side === winner);
  if (!filtered.length) return null;

  filtered.sort((a, b) => {
    const aScore =
      a.exchangesWon * 3 -
      a.exchangesLost +
      (a.currentState === "KO" ? 0 : 2);
    const bScore =
      b.exchangesWon * 3 -
      b.exchangesLost +
      (b.currentState === "KO" ? 0 : 2);

    return bScore - aScore;
  });

  return filtered[0]?.card ?? null;
}

export function simulateStateBattle(
  mode: BattleMode,
  playerDeck: FighterCard[],
  enemyDeck: FighterCard[]
): BattleResultData<FighterCard> {
  const playerRuntime = makeRuntimeDeck("player", playerDeck);
  const enemyRuntime = makeRuntimeDeck("enemy", enemyDeck);

  const timeline: BattleResultData<FighterCard>["timeline"] = [];

  let round = 1;
  let exchange = 1;
  let safety = 0;

  while (safety < 240) {
    safety += 1;

    const playerIndex = getActiveIndex(playerRuntime);
    const enemyIndex = getActiveIndex(enemyRuntime);

    if (playerIndex === -1 || enemyIndex === -1) {
      break;
    }

    const player = playerRuntime[playerIndex];
    const enemy = enemyRuntime[enemyIndex];

    const playerInitiative = computeInitiativeScore(
      player,
      enemy,
      round * 10 + exchange
    );
    const enemyInitiative = computeInitiativeScore(
      enemy,
      player,
      round * 10 + exchange + 1
    );

    let attacker = playerInitiative >= enemyInitiative ? player : enemy;
    let defender = attacker.side === "player" ? enemy : player;

    if (hasStun(attacker)) {
      clearStun(attacker);
      const originalAttacker = attacker;
      attacker = defender;
      defender = originalAttacker;
    }

    const attackerAbility = getAbilityModifier({
      attacker,
      defender,
    });

    applyStatuses(attacker, attackerAbility.applyToSelf);
    applyStatuses(defender, attackerAbility.applyToEnemy);

    const entryScore = computeEntryScore(
      attacker,
      defender,
      round * 100 + exchange * 3
    );
    const readScore = computeReadScore(
      defender,
      attacker,
      round * 100 + exchange * 3 + 1
    );

    let winner: "player" | "enemy" | "draw" = "draw";
    let resultText = "";
    let offenseScore = 0;
    let defenseScore = 0;

    if (entryScore >= readScore + 6) {
      const attackPower = computeAttackPower(
        attacker,
        defender,
        round * 100 + exchange * 7
      );
      const guardPower = computeGuardPower(
        defender,
        attacker,
        round * 100 + exchange * 7 + 1
      );

      offenseScore = Math.round(attackPower);
      defenseScore = Math.round(guardPower);

      const diff = attackPower - guardPower;
      const tier = determineExchangeTier(diff);

      if (diff >= 0) {
        if (tier === "light") {
          applyStateOutcome(defender, "light");
          resultText = `${attacker.card.name} forced a light opening and pushed ${defender.card.name} back.`;
        } else if (tier === "heavy") {
          applyStateOutcome(defender, "heavy");
          resultText = `${attacker.card.name} won a clean exchange with superior stat pressure.`;
        } else {
          applyStateOutcome(defender, "crushing");
          resultText = `${attacker.card.name} completely overpowered ${defender.card.name} in the clash.`;
        }

        attacker.exchangesWon += 1;
        defender.exchangesLost += 1;
        winner = attacker.side;
      } else {
        applyStateOutcome(attacker, "light");
        defender.exchangesWon += 1;
        attacker.exchangesLost += 1;
        winner = defender.side;
        resultText = `${defender.card.name} absorbed the entry and turned the exchange around.`;
      }
    } else {
      offenseScore = Math.round(entryScore);
      defenseScore = Math.round(readScore);

      applyStateOutcome(attacker, "light");
      defender.exchangesWon += 1;
      attacker.exchangesLost += 1;
      winner = defender.side;
      resultText = `${defender.card.name} read the approach and denied the opening.`;
    }

    const log: BattleExchangeLog = {
      round,
      exchange,
      attackerSide: attacker.side,
      defenderSide: defender.side,
      attackerName: attacker.card.name,
      defenderName: defender.card.name,
      initiativeScore: {
        player: Math.round(playerInitiative),
        enemy: Math.round(enemyInitiative),
      },
      offenseScore,
      defenseScore,
      winner,
      resultText,
      attackerStateAfter: attacker.currentState,
      defenderStateAfter: defender.currentState,
      triggeredAbility: attackerAbility.triggeredAbility,
    };

    timeline.push({
      type: "exchange",
      payload: log,
    });

    if (attacker.currentState === "KO") {
      timeline.push({
        type: "ko",
        payload: {
          round,
          side: attacker.side,
          name: attacker.card.name,
          defeatedBy: defender.card.name,
        },
      });
      round += 1;
      exchange = 1;
    } else if (defender.currentState === "KO") {
      timeline.push({
        type: "ko",
        payload: {
          round,
          side: defender.side,
          name: defender.card.name,
          defeatedBy: attacker.card.name,
        },
      });
      round += 1;
      exchange = 1;
    } else {
      exchange += 1;
    }

    tickStatuses(player);
    tickStatuses(enemy);
  }

  const playerRemaining = playerRuntime.filter(
    (item) => item.currentState !== "KO"
  ).length;
  const enemyRemaining = enemyRuntime.filter(
    (item) => item.currentState !== "KO"
  ).length;

  const winner =
    enemyRemaining === 0
      ? "player"
      : playerRemaining === 0
        ? "enemy"
        : scoreDeck(playerRuntime) >= scoreDeck(enemyRuntime)
          ? "player"
          : "enemy";

  return {
    mode,
    winner,
    rewardCoins: getRewardCoins(mode, winner),
    playerScore: scoreDeck(playerRuntime),
    enemyScore: scoreDeck(enemyRuntime),
    mvp: getMvp([...playerRuntime, ...enemyRuntime], winner),
    playerDeck,
    enemyDeck,
    timeline,
    roundsPlayed: Math.max(round - 1, 1),
    kos: {
      player: playerRuntime.filter((item) => item.currentState === "KO").length,
      enemy: enemyRuntime.filter((item) => item.currentState === "KO").length,
    },
  };
}

export function getBattleHeadline(result: BattleResultData<FighterCard>) {
  return result.winner === "player"
    ? `Victory in ${result.roundsPlayed} rounds`
    : `Defeat after ${result.roundsPlayed} rounds`;
}

export function getBattleSummaryText(result: BattleResultData<FighterCard>) {
  const playerAlive = result.playerDeck.length - result.kos.player;
  const enemyAlive = result.enemyDeck.length - result.kos.enemy;

  if (result.winner === "player") {
    return `Your team won the arena clash. Survivors: ${playerAlive}. Enemy survivors: ${enemyAlive}.`;
  }

  return `The enemy team took the match. Your survivors: ${playerAlive}. Enemy survivors: ${enemyAlive}.`;
}