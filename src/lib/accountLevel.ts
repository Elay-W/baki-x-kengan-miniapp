export type LevelTier =
  | "bronze"
  | "silver"
  | "gold"
  | "crimson"
  | "legend"
  | "divine";

export type LevelReward = {
  level: number;
  title: string;
  description: string;
};

export function clampLevel(level: number) {
  return Math.max(1, Math.min(100, level));
}

export function getLevelTier(level: number): LevelTier {
  const safe = clampLevel(level);

  if (safe <= 10) return "bronze";
  if (safe <= 25) return "silver";
  if (safe <= 45) return "gold";
  if (safe <= 65) return "crimson";
  if (safe <= 85) return "legend";
  return "divine";
}

export function getLevelStyle(level: number) {
  const tier = getLevelTier(level);

  switch (tier) {
    case "bronze":
      return {
        tier,
        name: "Bronze",
        border: "rgba(170,120,75,0.65)",
        glow: "rgba(170,120,75,0.22)",
        bg: "linear-gradient(180deg, rgba(120,72,35,0.55), rgba(30,18,10,0.92))",
        text: "#f0c19b",
      };

    case "silver":
      return {
        tier,
        name: "Silver",
        border: "rgba(180,190,210,0.7)",
        glow: "rgba(180,190,210,0.22)",
        bg: "linear-gradient(180deg, rgba(110,120,140,0.55), rgba(18,20,28,0.94))",
        text: "#e7edf8",
      };

    case "gold":
      return {
        tier,
        name: "Gold",
        border: "rgba(230,183,70,0.75)",
        glow: "rgba(230,183,70,0.24)",
        bg: "linear-gradient(180deg, rgba(155,112,22,0.55), rgba(24,18,8,0.94))",
        text: "#ffe39a",
      };

    case "crimson":
      return {
        tier,
        name: "Crimson",
        border: "rgba(210,56,74,0.78)",
        glow: "rgba(210,56,74,0.24)",
        bg: "linear-gradient(180deg, rgba(130,18,30,0.55), rgba(25,8,12,0.95))",
        text: "#ff9ba8",
      };

    case "legend":
      return {
        tier,
        name: "Legend",
        border: "rgba(148,94,255,0.78)",
        glow: "rgba(148,94,255,0.25)",
        bg: "linear-gradient(180deg, rgba(78,32,158,0.55), rgba(14,9,26,0.95))",
        text: "#d7b8ff",
      };

    case "divine":
    default:
      return {
        tier,
        name: "Divine",
        border: "rgba(255,96,42,0.82)",
        glow: "rgba(255,140,70,0.28)",
        bg: "linear-gradient(180deg, rgba(150,38,8,0.62), rgba(30,10,6,0.96))",
        text: "#ffd2a3",
      };
  }
}

export function getLevelRewards(): LevelReward[] {
  return [
    {
      level: 2,
      title: "Starter Yen",
      description: "Receive a small Yen reward to accelerate your early roster growth.",
    },
    {
      level: 5,
      title: "Street Pack",
      description: "Unlock a free Street Pack and begin building your underground pool.",
    },
    {
      level: 10,
      title: "Bronze Rank Frame",
      description: "Your account enters the Bronze tier and gains its first framed level badge.",
    },
    {
      level: 15,
      title: "Arena Access Bonus",
      description: "Gain extra Yen and faster entry into regular battle rotation.",
    },
    {
      level: 20,
      title: "Street Pack Bundle",
      description: "A multi-pack reward to reinforce collection growth.",
    },
    {
      level: 25,
      title: "Silver Rank Frame",
      description: "Your account badge upgrades to Silver with a brighter metallic frame.",
    },
    {
      level: 30,
      title: "Arena Pack",
      description: "Get a stronger pack tier with better progression pressure.",
    },
    {
      level: 35,
      title: "Profile Accent",
      description: "Unlock a sharper account accent tied to your level tier.",
    },
    {
      level: 40,
      title: "Yen Reserve",
      description: "Receive a larger Yen payout for midgame progression.",
    },
    {
      level: 45,
      title: "Gold Rank Frame",
      description: "Your level frame upgrades to Gold and gains a stronger glow.",
    },
    {
      level: 50,
      title: "Kengan Pack",
      description: "A milestone reward tied to premium-feeling card progression.",
    },
    {
      level: 55,
      title: "Token Bonus",
      description: "Receive a small amount of Purgatory Tokens.",
    },
    {
      level: 60,
      title: "Arena Pack Bundle",
      description: "A stronger reward bundle for entering the advanced ladder.",
    },
    {
      level: 65,
      title: "Crimson Rank Frame",
      description: "Your account enters Crimson tier with a sharper elite look.",
    },
    {
      level: 70,
      title: "Purgatory Access Reward",
      description: "Gain premium resources and improved event readiness.",
    },
    {
      level: 75,
      title: "Kengan Pack Bundle",
      description: "A high-value collection spike for late progression.",
    },
    {
      level: 80,
      title: "Token Reserve",
      description: "Receive a larger premium currency reward.",
    },
    {
      level: 85,
      title: "Legend Rank Frame",
      description: "Your account badge upgrades into a prestige class.",
    },
    {
      level: 90,
      title: "Purgatory Pack",
      description: "A premium pack milestone reward for top progression.",
    },
    {
      level: 95,
      title: "Elite Prestige Bonus",
      description: "High-end progression payout ahead of the final bracket.",
    },
    {
      level: 100,
      title: "Divine Rank Frame",
      description: "Maximum account level. Unlock the final prestige frame and top-tier status.",
    },
  ];
}