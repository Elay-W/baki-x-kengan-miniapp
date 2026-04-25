import type {
  ArenaClashFighterProfile,
  ArenaClashSkillDefinition,
  ArenaClashSupportCard,
} from "@/lib/arenaClashTypes";

export const arenaClashSkillRegistry: Record<string, ArenaClashSkillDefinition> = {
  yujiro_demon_pressure: {
    key: "yujiro_demon_pressure",
    name: "Demon Pressure",
    shortLabel: "DEMON",
    type: "Burst",
    tempoCost: 78,
    forceCost: 20,
    cooldownRounds: 2,
    allowedRows: ["front", "core"],
    targetRule: "front-enemy",
    statScaling: {
      STR: 0.32,
      TECH: 0.18,
      INSTINCT: 0.26,
      SPD: 0.08,
    },
    popupText: "DEMON PRESSURE",
    description:
      "A crushing burst sequence that massively raises pressure and becomes especially lethal into unstable targets.",
    keywords: ["burst", "pressure", "break", "hanma"],
  },

  shen_connector_principles: {
    key: "shen_connector_principles",
    name: "Connector Principles",
    shortLabel: "CONNECT",
    type: "Passive",
    tempoCost: 52,
    cooldownRounds: 2,
    allowedRows: ["front", "core"],
    targetRule: "self",
    statScaling: {
      TECH: 0.26,
      INSTINCT: 0.32,
      SPD: 0.14,
      DEF: 0.06,
    },
    popupText: "CONNECTOR",
    description:
      "A perfectly controlled reading state that boosts read advantage, guard shaping, and technical execution.",
    keywords: ["read", "technique", "control"],
  },

  baki_adaptive_burst: {
    key: "baki_adaptive_burst",
    name: "Adaptive Burst",
    shortLabel: "ADAPT",
    type: "Strike",
    tempoCost: 54,
    cooldownRounds: 2,
    allowedRows: ["core", "front"],
    targetRule: "same-lane-enemy",
    statScaling: {
      SPD: 0.2,
      TECH: 0.24,
      INSTINCT: 0.22,
      STR: 0.12,
    },
    popupText: "ADAPTIVE BURST",
    description:
      "Baki adapts instantly to the exchange and converts that read into a pressure spike on the same lane.",
    keywords: ["adapt", "pressure", "tempo"],
  },

  ohma_advance_flow: {
    key: "ohma_advance_flow",
    name: "Advance Flow",
    shortLabel: "ADVANCE",
    type: "Charge",
    tempoCost: 46,
    cooldownRounds: 2,
    allowedRows: ["core", "front"],
    targetRule: "self",
    statScaling: {
      SPD: 0.24,
      TECH: 0.22,
      INSTINCT: 0.18,
      DUR: 0.1,
    },
    popupText: "ADVANCE",
    description:
      "A dangerous acceleration state that spikes force and tempo for future clashes at the cost of later stability.",
    keywords: ["charge", "tempo", "force", "state"],
  },

  kuroki_devil_lance: {
    key: "kuroki_devil_lance",
    name: "Devil Lance",
    shortLabel: "LANCE",
    type: "Burst",
    tempoCost: 60,
    forceCost: 12,
    cooldownRounds: 2,
    allowedRows: ["core", "front"],
    targetRule: "front-enemy",
    statScaling: {
      TECH: 0.3,
      INSTINCT: 0.2,
      STR: 0.18,
      SPD: 0.08,
    },
    popupText: "DEVIL LANCE",
    description:
      "A piercing finishing technique that converts technical superiority into severe guard-breaking pressure.",
    keywords: ["pierce", "guard-break", "finish"],
  },

  wakatsuki_blast_core: {
    key: "wakatsuki_blast_core",
    name: "Blast Core",
    shortLabel: "BLAST",
    type: "Burst",
    tempoCost: 68,
    forceCost: 18,
    cooldownRounds: 2,
    allowedRows: ["front", "core"],
    targetRule: "front-enemy",
    statScaling: {
      STR: 0.34,
      TECH: 0.12,
      INSTINCT: 0.14,
      DUR: 0.08,
    },
    popupText: "BLAST CORE",
    description:
      "A devastating full-body burst that overloads a frontline target with massive pressure.",
    keywords: ["burst", "frontline", "power"],
  },

  jack_goudou: {
    key: "jack_goudou",
    name: "Goudou",
    shortLabel: "GOUDOU",
    type: "Strike",
    tempoCost: 48,
    cooldownRounds: 2,
    allowedRows: ["front", "core"],
    targetRule: "front-enemy",
    statScaling: {
      STR: 0.28,
      DUR: 0.1,
      INSTINCT: 0.16,
      TECH: 0.12,
    },
    popupText: "GOUDOU",
    description:
      "A savage close-range mauling sequence that keeps building pressure if Jack wins repeated clashes.",
    keywords: ["pressure", "maul", "repeat"],
  },

  gaolang_flash_jab: {
    key: "gaolang_flash_jab",
    name: "Flash Jab Chain",
    shortLabel: "JAB",
    type: "Strike",
    tempoCost: 52,
    cooldownRounds: 2,
    allowedRows: ["core"],
    targetRule: "same-lane-enemy",
    statScaling: {
      SPD: 0.26,
      TECH: 0.24,
      INSTINCT: 0.18,
      STR: 0.14,
    },
    popupText: "FLASH JAB",
    description:
      "A rapid elite striking chain that excels at cracking guard and building clean break pressure.",
    keywords: ["strike", "guard-break", "tempo"],
  },

  shibukawa_aiki: {
    key: "shibukawa_aiki",
    name: "Aiki",
    shortLabel: "AIKI",
    type: "Guard",
    tempoCost: 44,
    cooldownRounds: 2,
    allowedRows: ["front", "core"],
    targetRule: "self",
    statScaling: {
      TECH: 0.26,
      INSTINCT: 0.28,
      DEF: 0.16,
      SPD: 0.08,
    },
    popupText: "AIKI",
    description:
      "A deceptive defensive read that blunts incoming pressure and turns aggression into positional loss.",
    keywords: ["guard", "counter", "read"],
  },

  musashi_imaginary_cut: {
    key: "musashi_imaginary_cut",
    name: "Imaginary Cut",
    shortLabel: "CUT",
    type: "Burst",
    tempoCost: 58,
    forceCost: 10,
    cooldownRounds: 2,
    allowedRows: ["core", "front"],
    targetRule: "same-lane-enemy",
    statScaling: {
      TECH: 0.32,
      INSTINCT: 0.18,
      SPD: 0.14,
      STR: 0.12,
    },
    popupText: "IMAGINARY CUT",
    description:
      "A lethal technical cut that slices through defensive structure and sharply raises break pressure.",
    keywords: ["pierce", "technical", "burst"],
  },

  rei_lightning_entry: {
    key: "rei_lightning_entry",
    name: "Lightning Entry",
    shortLabel: "ENTRY",
    type: "Switch",
    tempoCost: 48,
    cooldownRounds: 2,
    allowedRows: ["reserve", "core"],
    targetRule: "entry-slot",
    statScaling: {
      SPD: 0.28,
      INSTINCT: 0.28,
      TECH: 0.16,
    },
    popupText: "LIGHTNING ENTRY",
    description:
      "A switch-specialist entry that spikes tempo and read advantage immediately after replacing an ally.",
    keywords: ["switch", "entry", "tempo", "read"],
    onSwitchOnly: true,
  },

  julius_monster_hold: {
    key: "julius_monster_hold",
    name: "Monster Hold",
    shortLabel: "HOLD",
    type: "Guard",
    tempoCost: 40,
    cooldownRounds: 2,
    allowedRows: ["front"],
    targetRule: "self",
    statScaling: {
      DEF: 0.34,
      DUR: 0.26,
      STR: 0.14,
      TECH: 0.08,
    },
    popupText: "MONSTER HOLD",
    description:
      "Massively hardens frontline defense, reflects part of the momentum back, and stabilizes the lane.",
    keywords: ["guard", "front", "hold"],
  },
};

export const arenaClashSupportRegistry: Record<string, ArenaClashSupportCard> = {
  demon_back: {
    id: "demon_back",
    name: "Demon Back",
    tier: "god-like",
    category: "body-state",
    storedForceCost: 3,
    roundGate: 3,
    durationRounds: 2,
    oncePerMatch: true,
    popupText: "DEMON BACK",
    description:
      "Massive body-state power spike. Strong global buff and extreme synergy with Yujiro.",
    keywords: ["god-like", "body-state", "burst", "pressure"],
    baseModifiers: {
      strikePressurePct: 0.18,
      burstPressurePct: 0.12,
      breakThresholdPct: 0.1,
      readValueFlat: 10,
    },
    synergyBySlug: {
      "yujiro-hanma": {
        strikePressurePct: 0.3,
        burstPressurePct: 0.24,
        breakThresholdPct: 0.14,
        readValueFlat: 16,
        ignoreFirstBreak: true,
      },
    },
  },

  fist_eye_analysis: {
    id: "fist_eye_analysis",
    name: "Fist Eye Analysis",
    tier: "standard",
    category: "tactical",
    storedForceCost: 1,
    durationRounds: 2,
    popupText: "READ UP",
    description:
      "Improves read advantage and counter windows. Strong on TECH/INSTINCT fighters.",
    keywords: ["read", "counter", "tempo"],
    baseModifiers: {
      readValueFlat: 8,
      tempoCostReductionFlat: 8,
    },
    synergyBySlug: {
      "koga-narushima": {
        readValueFlat: 14,
        tempoCostReductionFlat: 12,
      },
    },
  },

  indestructible_stance: {
    id: "indestructible_stance",
    name: "Indestructible Stance",
    tier: "standard",
    category: "aura",
    storedForceCost: 2,
    durationRounds: 2,
    popupText: "STANCE UP",
    description:
      "Line-wide defensive stance that increases guard value and break resistance.",
    keywords: ["guard", "frontline", "break-resist"],
    baseModifiers: {
      guardValuePct: 0.16,
      breakThresholdPct: 0.1,
    },
  },

  adrenal_override: {
    id: "adrenal_override",
    name: "Adrenal Override",
    tier: "standard",
    category: "burst",
    storedForceCost: 1,
    durationRounds: 1,
    popupText: "OVERRIDE",
    description:
      "A short offensive spike for an all-in round. Strong on SPD/STR/INSTINCT burst users.",
    keywords: ["burst", "tempo", "pressure"],
    baseModifiers: {
      burstPressurePct: 0.14,
      chargeGainPct: 0.1,
    },
  },
};

export const arenaClashFighterProfilesById: Record<number, ArenaClashFighterProfile> = {
  1: {
    fighterId: 1,
    slug: "yujiro-hanma",
    roleTags: ["frontliner", "bruiser", "burst-carry"],
    preferredRows: ["front", "core"],
    signatureSkillKey: "yujiro_demon_pressure",
    supportAffinityTags: ["hanma", "god-like"],
  },
  2: {
    fighterId: 2,
    slug: "shen-wulong",
    roleTags: ["controller", "counter", "support-friendly"],
    preferredRows: ["core", "front"],
    signatureSkillKey: "shen_connector_principles",
    supportAffinityTags: ["connector", "control"],
  },
  3: {
    fighterId: 3,
    slug: "baki-hanma",
    roleTags: ["core-carry", "tempo", "counter"],
    preferredRows: ["core", "front"],
    signatureSkillKey: "baki_adaptive_burst",
    supportAffinityTags: ["hanma", "adapt"],
  },
  4: {
    fighterId: 4,
    slug: "tokita-ohma",
    roleTags: ["core-carry", "tempo", "support-friendly"],
    preferredRows: ["core"],
    signatureSkillKey: "ohma_advance_flow",
    supportAffinityTags: ["advance", "niko-style"],
  },
  5: {
    fighterId: 5,
    slug: "kuroki-gensai",
    roleTags: ["counter", "core-carry", "controller"],
    preferredRows: ["core", "front"],
    signatureSkillKey: "kuroki_devil_lance",
    supportAffinityTags: ["devil-lance", "karate"],
  },
  6: {
    fighterId: 6,
    slug: "wakatsuki-takeshi",
    roleTags: ["frontliner", "bruiser", "burst-carry"],
    preferredRows: ["front", "core"],
    signatureSkillKey: "wakatsuki_blast_core",
    supportAffinityTags: ["blast-core", "power"],
  },
  7: {
    fighterId: 7,
    slug: "jack-hanma",
    roleTags: ["frontliner", "bruiser"],
    preferredRows: ["front", "core"],
    signatureSkillKey: "jack_goudou",
    supportAffinityTags: ["hanma", "maul"],
  },
  8: {
    fighterId: 8,
    slug: "gaolang-wongsawat",
    roleTags: ["core-carry", "tempo", "counter"],
    preferredRows: ["core"],
    signatureSkillKey: "gaolang_flash_jab",
    supportAffinityTags: ["boxing", "flash"],
  },
  9: {
    fighterId: 9,
    slug: "shibukawa-gouki",
    roleTags: ["counter", "controller", "support-friendly"],
    preferredRows: ["front", "core"],
    signatureSkillKey: "shibukawa_aiki",
    supportAffinityTags: ["aiki", "redirect"],
  },
  10: {
    fighterId: 10,
    slug: "miyamoto-musashi",
    roleTags: ["core-carry", "controller", "burst-carry"],
    preferredRows: ["core", "front"],
    signatureSkillKey: "musashi_imaginary_cut",
    supportAffinityTags: ["blade", "technical"],
  },
  11: {
    fighterId: 11,
    slug: "rei-mikazuchi",
    roleTags: ["tempo", "switch-specialist", "counter"],
    preferredRows: ["core"],
    signatureSkillKey: "rei_lightning_entry",
    supportAffinityTags: ["entry", "switch", "lightning"],
  },
  12: {
    fighterId: 12,
    slug: "julius-reinhold",
    roleTags: ["frontliner", "tank", "bruiser"],
    preferredRows: ["front"],
    signatureSkillKey: "julius_monster_hold",
    supportAffinityTags: ["monster", "hold"],
  },
};

export const arenaClashFighterProfilesBySlug: Record<string, ArenaClashFighterProfile> =
  Object.values(arenaClashFighterProfilesById).reduce(
    (acc, profile) => {
      acc[profile.slug] = profile;
      return acc;
    },
    {} as Record<string, ArenaClashFighterProfile>,
  );

export function getArenaClashSkill(skillKey?: string | null): ArenaClashSkillDefinition | null {
  if (!skillKey) return null;
  return arenaClashSkillRegistry[skillKey] ?? null;
}

export function hasArenaClashSkill(skillKey?: string | null): boolean {
  if (!skillKey) return false;
  return skillKey in arenaClashSkillRegistry;
}

export function getAllArenaClashSkills(): ArenaClashSkillDefinition[] {
  return Object.values(arenaClashSkillRegistry);
}

export function getArenaClashSupport(
  supportId?: string | null,
): ArenaClashSupportCard | null {
  if (!supportId) return null;
  return arenaClashSupportRegistry[supportId] ?? null;
}

export function getAllArenaClashSupports(): ArenaClashSupportCard[] {
  return Object.values(arenaClashSupportRegistry);
}

export function getArenaClashFighterProfile(
  fighterId: number,
): ArenaClashFighterProfile | null {
  return arenaClashFighterProfilesById[fighterId] ?? null;
}

export function getArenaClashFighterProfileBySlug(
  slug?: string | null,
): ArenaClashFighterProfile | null {
  if (!slug) return null;
  return arenaClashFighterProfilesBySlug[slug] ?? null;
}

export function getArenaClashSkillForFighter(
  fighterId: number,
): ArenaClashSkillDefinition | null {
  const profile = getArenaClashFighterProfile(fighterId);
  if (!profile) return null;
  return getArenaClashSkill(profile.signatureSkillKey);
}

export function resolveArenaClashSkillKey(card: {
  fighterId?: number;
  slug?: string | null;
  arenaClashSkillKey?: string | null;
  manualSkillKey?: string | null;
  abilityKey?: string | null;
}): string | null {
  if (card.arenaClashSkillKey) return card.arenaClashSkillKey;
  if (card.manualSkillKey) return card.manualSkillKey;
  if (card.abilityKey) return card.abilityKey;

  if (typeof card.fighterId === "number") {
    const byId = getArenaClashFighterProfile(card.fighterId);
    if (byId?.signatureSkillKey) return byId.signatureSkillKey;
  }

  if (card.slug) {
    const bySlug = getArenaClashFighterProfileBySlug(card.slug);
    if (bySlug?.signatureSkillKey) return bySlug.signatureSkillKey;
  }

  return null;
}

export function getArenaClashSkillForCard(card: {
  fighterId?: number;
  slug?: string | null;
  arenaClashSkillKey?: string | null;
  manualSkillKey?: string | null;
  abilityKey?: string | null;
}): ArenaClashSkillDefinition | null {
  return getArenaClashSkill(resolveArenaClashSkillKey(card));
}