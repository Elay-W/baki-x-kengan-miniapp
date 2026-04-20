export type ScreenRoute = "home" | "collection" | "deck" | "battle" | "shop" | "profile";

export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Elite"
  | "Legendary"
  | "God-like"
  | "Divine";

export type FighterType =
  | "Powerhouse"
  | "Tank"
  | "Speedster"
  | "Technician"
  | "Wildcard";

export type Universe = "Baki" | "Kengan";

export type FighterCard = {
  id: number;
  name: string;
  title: string;
  rarity: Rarity;
  stars: number;
  universe: Universe;
  type: FighterType;
  stats: {
    STR: number;
    SPD: number;
    TECH: number;
    DUR: number;
    DEF: number;
    INSTINCT: number;
  };
  skill: string;
  copies?: number;
  abilityKey?: string;
};