import type { ArenaClashSkillDefinition } from "@/lib/arenaClashTypes";

export const arenaClashSkillRegistry: Record<string, ArenaClashSkillDefinition> = {
  yujiro_demon_back: {
    key: "yujiro_demon_back",
    name: "Demon Back",
    type: "Burst",
    focusCost: 4,
    oncePerBattle: true,
    allowedActions: ["Skill"],
    allowedWindows: ["OnReveal", "OnPower"],
    target: "self",
    modifiesClash: ["SpeedClash", "EntryClash", "PowerClash"],
    flatBonuses: {
      STR: 14,
      SPD: 8,
      INSTINCT: 10,
    },
    resultShift: {
      onWin: 1,
    },
    description:
      "Yujiro unleashes a monstrous burst of dominance, greatly improving tempo, entry, and finishing pressure.",
  },

  shen_connector_principles: {
    key: "shen_connector_principles",
    name: "Connector Principles",
    type: "Utility",
    focusCost: 4,
    oncePerFielding: true,
    allowedActions: ["Skill"],
    allowedWindows: ["OnReveal", "OnEntry", "OnReversal"],
    target: "self",
    modifiesClash: ["EntryClash", "ReversalClash", "SpeedClash"],
    flatBonuses: {
      SPD: 8,
      TECH: 10,
      INSTINCT: 12,
    },
    weightShift: {
      entryTECH: 0.1,
      entryINSTINCT: 0.1,
      reversalTECH: 0.1,
      reversalINSTINCT: 0.15,
    },
    description:
      "Shen shifts the exchange toward perfect reading, timing, and technical superiority.",
  },

  baki_adaptive_burst: {
    key: "baki_adaptive_burst",
    name: "Adaptive Burst",
    type: "Utility",
    focusCost: 2,
    cooldownExchanges: 2,
    allowedActions: ["Skill"],
    allowedWindows: ["OnReveal", "OnEntry", "AfterLoss"],
    target: "self",
    modifiesClash: ["EntryClash", "PowerClash", "SpeedClash"],
    flatBonuses: {
      SPD: 6,
      TECH: 8,
      INSTINCT: 8,
    },
    description:
      "Baki rapidly adapts after pressure or on entry, sharpening speed, reads, and technique.",
  },

  ohma_advance: {
    key: "ohma_advance",
    name: "Advance",
    type: "Burst",
    focusCost: 3,
    oncePerFielding: true,
    allowedActions: ["Skill"],
    allowedWindows: ["OnReveal", "OnEntry", "OnPower"],
    target: "self",
    modifiesClash: ["SpeedClash", "EntryClash", "PowerClash"],
    flatBonuses: {
      SPD: 12,
      STR: 10,
    },
    applyStatusesToSelf: ["Strain"],
    description:
      "Forces a violent acceleration window, boosting speed and striking power at the cost of later strain.",
  },

  kuroki_devil_lance: {
    key: "kuroki_devil_lance",
    name: "Devil Lance",
    type: "Pierce",
    focusCost: 3,
    cooldownExchanges: 2,
    allowedActions: ["Skill"],
    allowedWindows: ["OnPower"],
    target: "enemy",
    modifiesClash: ["PowerClash"],
    flatBonuses: {
      TECH: 10,
    },
    ignoreDefensePercent: 40,
    applyStatusesToEnemy: ["GuardBreak"],
    description:
      "A piercing hand strike that bypasses a large portion of the enemy's defense and threatens guard integrity.",
  },

  wakatsuki_blast_core: {
    key: "wakatsuki_blast_core",
    name: "Blast Core",
    type: "Burst",
    focusCost: 3,
    oncePerFielding: true,
    allowedActions: ["Skill"],
    allowedWindows: ["OnPower"],
    target: "self",
    modifiesClash: ["PowerClash"],
    flatBonuses: {
      STR: 18,
    },
    applyStatusesToSelf: ["Strain"],
    applyStatusesToEnemy: ["Stun"],
    description:
      "A devastating power burst. If timed correctly it can stun the opponent, but it taxes Wakatsuki's body.",
  },

  jack_goudou: {
    key: "jack_goudou",
    name: "Goudou",
    type: "Control",
    focusCost: 2,
    cooldownExchanges: 1,
    allowedActions: ["Skill"],
    allowedWindows: ["OnPower", "AfterWin"],
    target: "enemy",
    modifiesClash: ["PowerClash"],
    flatBonuses: {
      STR: 8,
    },
    applyStatusesToEnemy: ["Bleed"],
    resultShift: {
      onWin: 1,
    },
    description:
      "Jack's savage offense inflicts bleed and becomes even more punishing once he successfully overwhelms the exchange.",
  },

  gaolang_flash_combo: {
    key: "gaolang_flash_combo",
    name: "Flash Combo",
    type: "Burst",
    focusCost: 2,
    cooldownExchanges: 1,
    allowedActions: ["Skill"],
    allowedWindows: ["OnSpeed", "OnEntry", "OnPower"],
    target: "self",
    modifiesClash: ["SpeedClash", "EntryClash", "PowerClash"],
    flatBonuses: {
      SPD: 10,
      TECH: 8,
    },
    description:
      "A rapid elite striking sequence that improves initiative, entry sharpness, and clean contact timing.",
  },

  shibukawa_aiki: {
    key: "shibukawa_aiki",
    name: "Aiki",
    type: "Counter",
    focusCost: 2,
    cooldownExchanges: 1,
    allowedActions: ["Skill"],
    allowedWindows: ["OnReversal"],
    target: "enemy",
    modifiesClash: ["ReversalClash"],
    flatBonuses: {
      TECH: 8,
      INSTINCT: 10,
    },
    resultShift: {
      onWin: 1,
    },
    description:
      "Redirects direct aggression into a technique-and-instinct reversal, punishing reckless force.",
  },

  musashi_imaginary_cut: {
    key: "musashi_imaginary_cut",
    name: "Imaginary Cut",
    type: "Pierce",
    focusCost: 3,
    cooldownExchanges: 2,
    allowedActions: ["Skill"],
    allowedWindows: ["OnEntry", "OnPower"],
    target: "enemy",
    modifiesClash: ["EntryClash", "PowerClash"],
    flatBonuses: {
      TECH: 12,
      INSTINCT: 4,
    },
    ignoreDefensePercent: 30,
    applyStatusesToEnemy: ["Bleed"],
    description:
      "A lethal technical cut that slices through defensive structure and leaves lingering pressure behind.",
  },
};

export function getArenaClashSkill(skillKey?: string | null): ArenaClashSkillDefinition | null {
  if (!skillKey) {
    return null;
  }

  return arenaClashSkillRegistry[skillKey] ?? null;
}

export function hasArenaClashSkill(skillKey?: string | null): boolean {
  if (!skillKey) {
    return false;
  }

  return skillKey in arenaClashSkillRegistry;
}

export function getAllArenaClashSkills(): ArenaClashSkillDefinition[] {
  return Object.values(arenaClashSkillRegistry);
}

export function resolveArenaClashSkillKey(card: {
  arenaClashSkillKey?: string;
  manualSkillKey?: string;
  abilityKey?: string;
}): string | null {
  return card.arenaClashSkillKey ?? card.manualSkillKey ?? card.abilityKey ?? null;
}

export function getArenaClashSkillForCard(card: {
  arenaClashSkillKey?: string;
  manualSkillKey?: string;
  abilityKey?: string;
}): ArenaClashSkillDefinition | null {
  return getArenaClashSkill(resolveArenaClashSkillKey(card));
}