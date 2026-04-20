import type { FighterCard } from "@/types/game";
import type { ActiveStatus, BattleCardRuntime, BattleLogSide } from "@/lib/battleTypes";
import {
  resolveAbilityKey,
  resolveAbilityRule,
  type AbilityModifier,
} from "@/lib/abilityRegistry";

function getText(card: FighterCard) {
  const skillText =
    "skill" in card && typeof card.skill === "string"
      ? card.skill
      : "specialSkill" in card &&
        typeof (card as FighterCard & { specialSkill?: string }).specialSkill === "string"
        ? (card as FighterCard & { specialSkill?: string }).specialSkill ?? ""
        : "";

  return `${card.name} ${card.title} ${card.type} ${skillText}`.toLowerCase();
}

function hasStatus(
  runtime: BattleCardRuntime<FighterCard>,
  type: ActiveStatus["type"]
) {
  return runtime.statuses.some((status) => status.type === type);
}

export function getAbilityModifier({
  attacker,
  defender,
}: {
  attacker: BattleCardRuntime<FighterCard>;
  defender: BattleCardRuntime<FighterCard>;
}): AbilityModifier {
  const registryRule = resolveAbilityRule(attacker.card);

  if (registryRule) {
    const result = registryRule({ attacker, defender });

    return {
      offenseBonus: result.offenseBonus ?? 0,
      defenseBonus: result.defenseBonus ?? 0,
      initiativeBonus: result.initiativeBonus ?? 0,
      applyToSelf: result.applyToSelf ?? [],
      applyToEnemy: result.applyToEnemy ?? [],
      triggeredAbility:
        result.triggeredAbility ??
        resolveAbilityKey(attacker.card) ??
        undefined,
    };
  }

  const card = attacker.card;
  const text = getText(card);

  const selfStatuses: ActiveStatus[] = [];
  const enemyStatuses: ActiveStatus[] = [];

  let offenseBonus = 0;
  let defenseBonus = 0;
  let initiativeBonus = 0;
  let triggeredAbility: string | undefined;

  if (hasStatus(attacker, "TempoUp")) {
    initiativeBonus += 10;
  }

  if (hasStatus(attacker, "Strain")) {
    offenseBonus -= 8;
    defenseBonus -= 6;
  }

  if (hasStatus(defender, "GuardBreak")) {
    offenseBonus += 12;
  }

  if (hasStatus(defender, "Bleed")) {
    offenseBonus += 8;
  }

  if (card.type === "Speedster") {
    initiativeBonus += 8;
  }

  if (card.type === "Tank") {
    defenseBonus += 8;
  }

  if (card.type === "Technician") {
    offenseBonus += 6;
  }

  if (card.type === "Powerhouse") {
    offenseBonus += 10;
  }

  if (card.type === "Wildcard") {
    offenseBonus += 4;
    defenseBonus += 4;
    initiativeBonus += 4;
  }

  if (text.includes("counter")) {
    if (defender.exchangesWon > attacker.exchangesWon) {
      offenseBonus += 12;
      triggeredAbility = "Counter Trigger";
    }
  }

  if (text.includes("bleed") || text.includes("goudou") || text.includes("poison")) {
    enemyStatuses.push({
      type: "Bleed",
      duration: 2,
      source: card.name,
    });
    triggeredAbility = triggeredAbility ?? "Bleed Pressure";
  }

  if (text.includes("shield") || text.includes("xiaoli") || text.includes("wall")) {
    selfStatuses.push({
      type: "Shield",
      duration: 1,
      source: card.name,
    });
    defenseBonus += 10;
    triggeredAbility = triggeredAbility ?? "Shield Guard";
  }

  if (text.includes("stun") || text.includes("zone")) {
    enemyStatuses.push({
      type: "Stun",
      duration: 1,
      source: card.name,
    });
    offenseBonus += 8;
    triggeredAbility = triggeredAbility ?? "Stun Control";
  }

  if (text.includes("advance") || text.includes("divine demon") || text.includes("removal")) {
    offenseBonus += 16;
    initiativeBonus += 10;
    selfStatuses.push({
      type: "Strain",
      duration: 2,
      source: card.name,
    });
    triggeredAbility = triggeredAbility ?? "Burst State";
  }

  if (text.includes("formless") || text.includes("adapt") || text.includes("copy")) {
    offenseBonus += 8;
    defenseBonus += 8;
    triggeredAbility = triggeredAbility ?? "Adaptive Read";
  }

  if (text.includes("devil lance") || text.includes("pierce") || text.includes("mach punch")) {
    offenseBonus += 14;
    enemyStatuses.push({
      type: "GuardBreak",
      duration: 1,
      source: card.name,
    });
    triggeredAbility = triggeredAbility ?? "Piercing Strike";
  }

  if (text.includes("lightning") || text.includes("flash") || text.includes("cockroach")) {
    initiativeBonus += 14;
    offenseBonus += 6;
    triggeredAbility = triggeredAbility ?? "Speed Burst";
  }

  if (text.includes("demon pressure") || text.includes("predator")) {
    offenseBonus += 10;
    initiativeBonus += 6;
    triggeredAbility = triggeredAbility ?? "Predator Pressure";
  }

  if (text.includes("demonsbane") || text.includes("aiki") || text.includes("redirection")) {
    defenseBonus += 14;
    offenseBonus += 8;
    triggeredAbility = triggeredAbility ?? "Reversal Defense";
  }

  return {
    offenseBonus,
    defenseBonus,
    initiativeBonus,
    applyToSelf: selfStatuses,
    applyToEnemy: enemyStatuses,
    triggeredAbility,
  };
}

export function applyStatuses(
  target: BattleCardRuntime<FighterCard>,
  statuses?: ActiveStatus[]
) {
  if (!statuses?.length) return;

  for (const status of statuses) {
    const existing = target.statuses.find((item) => item.type === status.type);

    if (existing) {
      existing.duration =
        typeof status.duration === "number"
          ? Math.max(existing.duration ?? 0, status.duration)
          : existing.duration;
      existing.stacks = (existing.stacks ?? 1) + (status.stacks ?? 1);
      continue;
    }

    target.statuses.push({ ...status });
  }
}

export function tickStatuses(target: BattleCardRuntime<FighterCard>) {
  target.statuses = target.statuses
    .map((status) => {
      if (typeof status.duration !== "number") return status;
      return {
        ...status,
        duration: status.duration - 1,
      };
    })
    .filter((status) => (status.duration ?? 1) > 0);
}

export function hasImmediateShield(target: BattleCardRuntime<FighterCard>) {
  return target.statuses.some((status) => status.type === "Shield");
}

export function consumeShield(target: BattleCardRuntime<FighterCard>) {
  const index = target.statuses.findIndex((status) => status.type === "Shield");
  if (index >= 0) {
    target.statuses.splice(index, 1);
    return true;
  }

  return false;
}

export function hasStun(target: BattleCardRuntime<FighterCard>) {
  return hasStatus(target, "Stun");
}

export function clearStun(target: BattleCardRuntime<FighterCard>) {
  target.statuses = target.statuses.filter((status) => status.type !== "Stun");
}

export function getSideLabel(side: BattleLogSide) {
  return side === "player" ? "Player" : "Enemy";
}