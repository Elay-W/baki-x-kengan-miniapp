export type ScreenRoute = "home" | "collection" | "deck" | "battle" | "shop" | "profile";

export type CardType =
  | "Powerhouse"
  | "Tank"
  | "Speedster"
  | "Technician"
  | "Wildcard";

export type Universe = "Baki" | "Kengan";

export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Elite"
  | "Legendary"
  | "God-like";

export type FighterCard = {
  id: number;
  name: string;
  title: string;
  universe: Universe;
  rarity: Rarity;
  stars: number;
  type: CardType;
  skill: string;
  stats: {
    STR: number;
    SPD: number;
    TECH: number;
    DUR: number;
    DEF: number;
    INSTINCT: number;
  };
};