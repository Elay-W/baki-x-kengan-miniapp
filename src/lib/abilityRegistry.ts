import type { FighterCard } from "@/types/game";
import type { ActiveStatus, BattleCardRuntime } from "@/lib/battleTypes";
import { cards } from "@/data/cards";

export type AbilityModifier = {
  offenseBonus?: number;
  defenseBonus?: number;
  initiativeBonus?: number;
  applyToSelf?: ActiveStatus[];
  applyToEnemy?: ActiveStatus[];
  triggeredAbility?: string;
};

export type AbilityRuntimeContext = {
  attacker: BattleCardRuntime<FighterCard>;
  defender: BattleCardRuntime<FighterCard>;
};

type AbilityRule = (ctx: AbilityRuntimeContext) => AbilityModifier;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

function hasStatus(
  runtime: BattleCardRuntime<FighterCard>,
  type: ActiveStatus["type"]
) {
  return runtime.statuses.some((status) => status.type === type);
}

function addStatus(list: ActiveStatus[], status: ActiveStatus) {
  const existing = list.find((item) => item.type === status.type);

  if (existing) {
    existing.duration =
      typeof status.duration === "number"
        ? Math.max(existing.duration ?? 0, status.duration)
        : existing.duration;
    existing.stacks = (existing.stacks ?? 1) + (status.stacks ?? 1);
    return;
  }

  list.push(status);
}

function buildNameKey(card: FighterCard) {
  return normalize(card.name);
}

function buildNameTitleKey(card: FighterCard) {
  return `${normalize(card.name)}__${normalize(card.title)}`;
}

export function getAbilityLookupKeys(card: FighterCard) {
  const keys = [buildNameTitleKey(card), buildNameKey(card)];

  if ("abilityKey" in card && typeof card.abilityKey === "string") {
    keys.unshift(card.abilityKey);
  }

  return Array.from(new Set(keys));
}

function containsAny(text: string, parts: string[]) {
  return parts.some((part) => text.includes(part));
}

function isUnderPressure(runtime: BattleCardRuntime<FighterCard>) {
  return runtime.currentState === "Pressured" || runtime.currentState === "Broken";
}

function rarityTier(card: FighterCard) {
  switch (card.rarity) {
    case "Common":
      return 0;
    case "Uncommon":
      return 1;
    case "Rare":
      return 2;
    case "Epic":
      return 3;
    case "Elite":
      return 4;
    case "Legendary":
      return 5;
    case "God-like":
      return 6;
    case "Divine":
      return 7;
    default:
      return 0;
  }
}

function getAutoBase(card: FighterCard) {
  const tier = rarityTier(card);

  let offenseBonus = 2 + Math.floor(tier / 2);
  let defenseBonus = 1 + Math.floor(tier / 3);
  let initiativeBonus = 1 + Math.floor(tier / 3);

  switch (card.type) {
    case "Powerhouse":
      offenseBonus += 6;
      defenseBonus += 1;
      break;
    case "Tank":
      defenseBonus += 7;
      offenseBonus += 1;
      break;
    case "Speedster":
      initiativeBonus += 8;
      offenseBonus += 2;
      break;
    case "Technician":
      offenseBonus += 4;
      defenseBonus += 3;
      break;
    case "Wildcard":
      offenseBonus += 3;
      defenseBonus += 3;
      initiativeBonus += 3;
      break;
  }

  return { offenseBonus, defenseBonus, initiativeBonus };
}

function buildAutoRule(card: FighterCard): AbilityRule {
  const skillText = `${card.title} ${card.skill}`.toLowerCase();

  return ({ attacker, defender }) => {
    const base = getAutoBase(card);
    let offenseBonus = base.offenseBonus;
    let defenseBonus = base.defenseBonus;
    let initiativeBonus = base.initiativeBonus;

    const selfStatuses: ActiveStatus[] = [];
    const enemyStatuses: ActiveStatus[] = [];
    let triggeredAbility = card.title || card.name;

    if (hasStatus(attacker, "TempoUp")) initiativeBonus += 4;
    if (hasStatus(attacker, "Strain")) {
      offenseBonus -= 8;
      defenseBonus -= 6;
    }
    if (hasStatus(defender, "GuardBreak")) offenseBonus += 8;
    if (hasStatus(defender, "Bleed")) offenseBonus += 6;
    if (hasStatus(defender, "TempoDown")) initiativeBonus += 3;

    if (containsAny(skillText, ["flash", "lightning", "cockroach", "step", "rush", "entry"])) {
      initiativeBonus += 8;
      offenseBonus += 4;
      triggeredAbility = "Speed Entry";
    }

    if (containsAny(skillText, ["counter", "reversal", "punish", "zone", "reflex", "read", "aiki", "demonsbane", "foresight"])) {
      defenseBonus += 10;
      offenseBonus += 4;
      if (defender.exchangesWon > attacker.exchangesWon || isUnderPressure(attacker)) {
        offenseBonus += 6;
      }
      triggeredAbility = "Counter Read";
    }

    if (containsAny(skillText, ["pierce", "devil lance", "mach punch", "imaginary cut", "blast core", "vice grip", "sword", "lance", "overbite"])) {
      offenseBonus += 12;
      addStatus(enemyStatuses, {
        type: "GuardBreak",
        duration: 1,
        source: attacker.card.name,
      });
      triggeredAbility = "Piercing Strike";
    }

    if (containsAny(skillText, ["bleed", "goudou", "bite", "poison", "rakshasa", "cut", "fang"])) {
      offenseBonus += 4;
      addStatus(enemyStatuses, {
        type: "Bleed",
        duration: 2,
        source: attacker.card.name,
      });
      triggeredAbility = "Bleed Pressure";
    }

    if (containsAny(skillText, ["shield", "wall", "iron prison", "mountain", "absolute muscle", "prepared", "unchained"])) {
      defenseBonus += 10;
      addStatus(selfStatuses, {
        type: "Shield",
        duration: 1,
        source: attacker.card.name,
      });
      triggeredAbility = "Shield Guard";
    }

    if (containsAny(skillText, ["stun", "slow", "timing window", "takedown"])) {
      addStatus(enemyStatuses, {
        type: "Stun",
        duration: 1,
        source: attacker.card.name,
      });
      offenseBonus += 6;
      triggeredAbility = "Stun Control";
    }

    if (containsAny(skillText, ["advance", "divine demon", "removal", "burst", "output", "surge", "vessel", "ogre full release"])) {
      offenseBonus += 12;
      initiativeBonus += 8;
      addStatus(selfStatuses, {
        type: "Strain",
        duration: 2,
        source: attacker.card.name,
      });
      triggeredAbility = "Burst State";
    }

    if (containsAny(skillText, ["connector", "copy", "imitation", "adaptive", "switch", "formless", "sync", "fist eye"])) {
      offenseBonus += 6;
      defenseBonus += 6;
      initiativeBonus += 4;
      triggeredAbility = "Adaptive Read";
    }

    if (containsAny(skillText, ["pressure", "predator", "execution", "monster", "street power", "spirit", "survivor"])) {
      offenseBonus += 6;
      if (isUnderPressure(attacker)) {
        offenseBonus += 6;
        defenseBonus += 4;
      }
      triggeredAbility = "Pressure Shift";
    }

    if (containsAny(skillText, ["tempo", "rotation", "gentle king", "swing"])) {
      addStatus(enemyStatuses, {
        type: "TempoDown",
        duration: 1,
        source: attacker.card.name,
      });
      initiativeBonus += 4;
      triggeredAbility = "Tempo Control";
    }

    if (containsAny(skillText, ["founder", "god", "connector peak", "kill a god"])) {
      offenseBonus += 8;
      defenseBonus += 6;
      initiativeBonus += 4;
      triggeredAbility = "Top-Tier Pressure";
    }

    return {
      offenseBonus,
      defenseBonus,
      initiativeBonus,
      applyToSelf: selfStatuses,
      applyToEnemy: enemyStatuses,
      triggeredAbility,
    };
  };
}

const manualRegistry: Record<string, AbilityRule> = {
  "yujiro_hanma__the_strongest_creature": ({ attacker }) => ({
    offenseBonus: 14,
    initiativeBonus: 8,
    defenseBonus: 8,
    applyToEnemy: [
      {
        type: "TempoDown",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Demon Pressure",
  }),

  "shen_wulong__the_connector": ({ attacker, defender }) => {
    const topStat = Math.max(
      defender.card.stats.STR,
      defender.card.stats.SPD,
      defender.card.stats.TECH,
      defender.card.stats.DUR,
      defender.card.stats.DEF,
      defender.card.stats.INSTINCT
    );
    const scaling = Math.round(topStat * 0.1);

    return {
      offenseBonus: 12 + scaling,
      defenseBonus: 10,
      initiativeBonus: 8,
      triggeredAbility: "Connector Sync",
    };
  },

  "baki_hanma__the_adaptive_fighter": ({ attacker }) => {
    const losing =
      attacker.exchangesLost > attacker.exchangesWon ||
      isUnderPressure(attacker);

    return losing
      ? {
          offenseBonus: 12,
          defenseBonus: 8,
          initiativeBonus: 6,
          triggeredAbility: "Adaptive Burst",
        }
      : {
          offenseBonus: 6,
          defenseBonus: 4,
          triggeredAbility: "Adaptive Read",
        };
  },

  "tokita_ohma__the_ashura": ({ attacker }) => ({
    offenseBonus: 10,
    initiativeBonus: 10,
    applyToSelf: [
      {
        type: "Strain",
        duration: 2,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Advance / Demonsbane",
  }),

  "kuroki_gensai__the_devil_lance": ({ attacker }) => ({
    offenseBonus: 16,
    applyToEnemy: [
      {
        type: "GuardBreak",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Devil Lance",
  }),

  "wakatsuki_takeshi__the_wild_tiger": ({ attacker }) => ({
    offenseBonus: 14,
    defenseBonus: 6,
    applyToEnemy: [
      {
        type: "GuardBreak",
        duration: 1,
        source: attacker.card.name,
      },
      {
        type: "Stun",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Blast Core",
  }),

  "jack_hanma__the_monster_biter": ({ attacker, defender }) => {
    const enemyStatuses: ActiveStatus[] = [];
    addStatus(enemyStatuses, {
      type: "Bleed",
      duration: 2,
      source: attacker.card.name,
    });

    return hasStatus(defender, "Bleed")
      ? {
          offenseBonus: 14,
          applyToEnemy: enemyStatuses,
          triggeredAbility: "Goudou Pressure",
        }
      : {
          offenseBonus: 8,
          applyToEnemy: enemyStatuses,
          triggeredAbility: "Bite Pressure",
        };
  },

  "gaolang_wongsawat__the_thai_god_of_war": ({ attacker }) => ({
    initiativeBonus: 12,
    offenseBonus: 6,
    triggeredAbility: "Flash Combination",
  }),

  "rei_mikazuchi__the_lightning_god": () => ({
    initiativeBonus: 18,
    offenseBonus: 8,
    triggeredAbility: "Lightning Flash",
  }),

  "hatsumi_sen__the_floating_cloud": ({ attacker }) =>
    isUnderPressure(attacker)
      ? {
          initiativeBonus: 10,
          offenseBonus: 12,
          defenseBonus: 8,
          triggeredAbility: "Peak Condition",
        }
      : {
          initiativeBonus: 6,
          defenseBonus: 10,
          triggeredAbility: "Floating Cloud",
        },

  "kaoru_hanayama__the_standing_man": ({ attacker }) => ({
    offenseBonus: 14,
    defenseBonus: 10,
    applyToEnemy: [
      {
        type: "GuardBreak",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Vice Grip",
  }),

  "biscuit_oliva__mr_unchained": ({ attacker }) => ({
    defenseBonus: 16,
    applyToSelf: [
      {
        type: "Shield",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Iron Prison",
  }),

  "pickle__the_primitive_monster": ({ attacker, defender }) => {
    const enemyStatuses: ActiveStatus[] = [];
    if (defender.card.type === "Tank" || defender.card.type === "Powerhouse") {
      addStatus(enemyStatuses, {
        type: "Bleed",
        duration: 2,
        source: attacker.card.name,
      });
    }

    return {
      offenseBonus: 16,
      defenseBonus: 8,
      applyToEnemy: enemyStatuses,
      triggeredAbility: "Primal Predator",
    };
  },

  "miyamoto_musashi__the_sword_saint": ({ attacker }) => ({
    offenseBonus: 16,
    applyToEnemy: [
      {
        type: "GuardBreak",
        duration: 1,
        source: attacker.card.name,
      },
      {
        type: "Bleed",
        duration: 2,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Imaginary Cut",
  }),

  "gouki_shibukawa__the_aiki_master": () => ({
    defenseBonus: 16,
    offenseBonus: 6,
    triggeredAbility: "Aiki Reversal",
  }),

  "doppo_orochi__the_god_hand": ({ attacker }) =>
    isUnderPressure(attacker)
      ? {
          offenseBonus: 14,
          defenseBonus: 6,
          triggeredAbility: "Tiger Fang Counter",
        }
      : {
          offenseBonus: 8,
          triggeredAbility: "God Hand",
        },

  "retsu_kaioh__the_kenpo_master": () => ({
    offenseBonus: 10,
    defenseBonus: 8,
    initiativeBonus: 4,
    triggeredAbility: "4000 Years of Kenpo",
  }),

  "katsumi_orochi__the_mach_fist": ({ attacker }) => ({
    offenseBonus: 14,
    applyToEnemy: [
      {
        type: "GuardBreak",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    applyToSelf: [
      {
        type: "Strain",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Mach Punch",
  }),

  "motobe_izou__the_prepared_warrior": ({ attacker, defender }) => {
    const selfStatuses: ActiveStatus[] = [];
    const enemyStatuses: ActiveStatus[] = [];

    if (defender.exchangesWon > attacker.exchangesWon) {
      addStatus(selfStatuses, {
        type: "Shield",
        duration: 1,
        source: attacker.card.name,
      });
    }

    addStatus(enemyStatuses, {
      type: "TempoDown",
      duration: 1,
      source: attacker.card.name,
    });

    return {
      defenseBonus: 10,
      offenseBonus: 8,
      applyToSelf: selfStatuses,
      applyToEnemy: enemyStatuses,
      triggeredAbility: "Prepared Warrior",
    };
  },

  "kanoh_agito__the_fang_of_metsudo": ({ attacker }) =>
    attacker.exchangesWon % 2 === 0
      ? {
          offenseBonus: 10,
          initiativeBonus: 8,
          triggeredAbility: "Formless Switch",
        }
      : {
          offenseBonus: 8,
          defenseBonus: 10,
          triggeredAbility: "Martial Arts Switch",
        },

  "rolón_donaire__the_monster_of_manila": () => ({
    initiativeBonus: 10,
    offenseBonus: 10,
    defenseBonus: 8,
    triggeredAbility: "Shoulder Rotation",
  }),

  "gaoh_mukaku__the_founder": ({ defender }) => {
    const topTier =
      defender.card.rarity === "God-like" || defender.card.rarity === "Divine";

    return topTier
      ? {
          offenseBonus: 18,
          defenseBonus: 8,
          triggeredAbility: "Kill a God",
        }
      : {
          offenseBonus: 10,
          defenseBonus: 6,
          triggeredAbility: "Founder’s Lesson",
        };
  },

  "julius_reinhold__the_monster": ({ attacker }) => ({
    offenseBonus: 18,
    defenseBonus: 8,
    applyToSelf: [
      {
        type: "Strain",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Monster Output",
  }),

  "fei_wangfang__the_tigers_vessel": ({ attacker }) => ({
    offenseBonus: 16,
    initiativeBonus: 10,
    applyToSelf: [
      {
        type: "Strain",
        duration: 2,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Tiger Vessel Burst",
  }),

  "kiryu_setsuna__the_beautiful_beast": ({ attacker }) => ({
    offenseBonus: 14,
    initiativeBonus: 8,
    applyToEnemy: [
      {
        type: "Bleed",
        duration: 2,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Rakshasa’s Palm",
  }),

  "akoya_seishu__the_executioner": ({ defender }) =>
    isUnderPressure(defender)
      ? {
          offenseBonus: 14,
          defenseBonus: 8,
          triggeredAbility: "Justice Execution",
        }
      : {
          defenseBonus: 10,
          triggeredAbility: "Justice Read",
        },

  "gaoh_ryuki__the_dragon_king": ({ attacker }) => ({
    initiativeBonus: 10,
    offenseBonus: 10,
    applyToEnemy: [
      {
        type: "Bleed",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Gaoh Style Entry",
  }),

  "narushima_koga__the_fist_eye": () => ({
    initiativeBonus: 8,
    defenseBonus: 8,
    triggeredAbility: "Fist Eye",
  }),

  "hanafusa_hajime__the_biohazard_doctor": ({ attacker }) => ({
    offenseBonus: 8,
    applyToEnemy: [
      {
        type: "Bleed",
        duration: 2,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Biohazard Protocol",
  }),

  "jurota_arashiyama__the_gentle_king": ({ attacker }) => ({
    offenseBonus: 12,
    defenseBonus: 10,
    applyToEnemy: [
      {
        type: "TempoDown",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Swing of the Gentle King",
  }),

  "toa_mudo__the_breathing_mountain": ({ attacker }) => ({
    defenseBonus: 14,
    offenseBonus: 10,
    applyToSelf: [
      {
        type: "Shield",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Breathing Mountain",
  }),

  "baki_hanma__father_son_duel": ({ attacker }) =>
    attacker.currentState === "Broken"
      ? {
          offenseBonus: 18,
          initiativeBonus: 14,
          defenseBonus: 10,
          triggeredAbility: "Demon Face Awake",
        }
      : {
          offenseBonus: 8,
          defenseBonus: 4,
          triggeredAbility: "Hanma Read",
        },

  "jack_hanma__goudou_rahen": ({ attacker, defender }) => {
    const enemyStatuses: ActiveStatus[] = [
      {
        type: "Bleed",
        duration: 2,
        source: attacker.card.name,
      },
    ];

    const selfStatuses: ActiveStatus[] = [];

    if (hasStatus(defender, "Bleed")) {
      addStatus(selfStatuses, {
        type: "Shield",
        duration: 1,
        source: attacker.card.name,
      });

      return {
        offenseBonus: 16,
        applyToEnemy: enemyStatuses,
        applyToSelf: selfStatuses,
        triggeredAbility: "Goudou Overbite",
      };
    }

    return {
      offenseBonus: 10,
      applyToEnemy: enemyStatuses,
      triggeredAbility: "Fang Pressure",
    };
  },

  "tokita_ohma__finals_demonsbane": ({ attacker }) => ({
    offenseBonus: 12,
    defenseBonus: 16,
    applyToEnemy: [
      {
        type: "GuardBreak",
        duration: 1,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Finals Demonsbane",
  }),

  "kanoh_agito__omega_hybrid_agito": ({ attacker }) =>
    attacker.exchangesWon % 2 === 0
      ? {
          offenseBonus: 10,
          initiativeBonus: 8,
          triggeredAbility: "Hybrid Fang • Formless",
        }
      : {
          offenseBonus: 8,
          defenseBonus: 10,
          triggeredAbility: "Hybrid Fang • Martial Arts",
        },

  "kure_raian__ashura_berserker": ({ defender }) =>
    isUnderPressure(defender)
      ? {
          offenseBonus: 14,
          initiativeBonus: 8,
          triggeredAbility: "Clan Devil",
        }
      : {
          offenseBonus: 8,
          triggeredAbility: "Kure Rush",
        },

  "kure_raian__removal_100": ({ attacker }) => ({
    offenseBonus: 18,
    initiativeBonus: 12,
    applyToSelf: [
      {
        type: "Strain",
        duration: 2,
        source: attacker.card.name,
      },
    ],
    triggeredAbility: "Removal 100%",
  }),

  "yujiro_hanma__demon_back_ogre": ({ attacker }) => {
    const selfStatuses: ActiveStatus[] = [];

    if (attacker.currentState === "Broken") {
      addStatus(selfStatuses, {
        type: "Shield",
        duration: 2,
        source: attacker.card.name,
      });

      return {
        offenseBonus: 20,
        initiativeBonus: 12,
        defenseBonus: 14,
        applyToSelf: selfStatuses,
        triggeredAbility: "Ogre Full Release",
      };
    }

    return {
      offenseBonus: 10,
      initiativeBonus: 6,
      triggeredAbility: "Predator Principle",
    };
  },

  "shen_wulong__connector_peak": ({ defender }) => {
    const topStat = Math.max(
      defender.card.stats.STR,
      defender.card.stats.SPD,
      defender.card.stats.TECH,
      defender.card.stats.DUR,
      defender.card.stats.DEF,
      defender.card.stats.INSTINCT
    );
    const scaling = Math.round(topStat * 0.1);

    return {
      offenseBonus: 12 + scaling,
      defenseBonus: 10,
      initiativeBonus: 8,
      triggeredAbility: "Connector Peak",
    };
  },
};

const generatedRegistry: Record<string, AbilityRule> = Object.fromEntries(
  cards.map((card) => {
    const key =
      (typeof card.abilityKey === "string" && card.abilityKey) ||
      buildNameTitleKey(card);

    return [key, buildAutoRule(card)];
  })
);

const abilityRegistry: Record<string, AbilityRule> = {
  ...generatedRegistry,
  ...manualRegistry,
};

export function resolveAbilityRule(card: FighterCard): AbilityRule | null {
  const keys = getAbilityLookupKeys(card);

  for (const key of keys) {
    if (abilityRegistry[key]) {
      return abilityRegistry[key];
    }
  }

  return null;
}

export function resolveAbilityKey(card: FighterCard): string | null {
  const keys = getAbilityLookupKeys(card);

  for (const key of keys) {
    if (abilityRegistry[key]) {
      return key;
    }
  }

  return null;
}

export function getAbilityRegistrySize() {
  return Object.keys(abilityRegistry).length;
}
