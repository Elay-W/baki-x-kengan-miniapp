import type { Rarity } from "@/types/game";

export function rarityColors(rarity: Rarity) {
  switch (rarity) {
    case "God-like":
      return { border: "rgba(239,68,68,0.5)", bg: "rgba(127,29,29,0.25)", text: "#fecaca" };
    case "Legendary":
      return { border: "rgba(251,146,60,0.5)", bg: "rgba(154,52,18,0.22)", text: "#fed7aa" };
    case "Elite":
      return { border: "rgba(250,204,21,0.45)", bg: "rgba(133,77,14,0.2)", text: "#fef08a" };
    case "Epic":
      return { border: "rgba(192,132,252,0.45)", bg: "rgba(88,28,135,0.22)", text: "#e9d5ff" };
    case "Rare":
      return { border: "rgba(96,165,250,0.45)", bg: "rgba(30,58,138,0.22)", text: "#bfdbfe" };
    case "Uncommon":
      return { border: "rgba(74,222,128,0.45)", bg: "rgba(20,83,45,0.22)", text: "#bbf7d0" };
    default:
      return { border: "rgba(161,161,170,0.4)", bg: "rgba(39,39,42,0.25)", text: "#e4e4e7" };
  }
}

export function statColor(value: number) {
  if (value >= 95) return "#ef4444";
  if (value >= 85) return "#fb923c";
  if (value >= 70) return "#facc15";
  if (value >= 55) return "#84cc16";
  return "#71717a";
}

export function glassCard() {
  return {
    background: "rgba(10,10,10,0.72)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
  } as const;
}

export function primaryButton() {
  return {
    padding: "14px 16px",
    borderRadius: 16,
    border: "none",
    background: "#ffffff",
    color: "#000000",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  } as const;
}

export function secondaryButton() {
  return {
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  } as const;
}

export function pageBackground() {
  return {
    minHeight: "100vh",
    color: "#fff",
    backgroundImage:
      "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.82)), url('/bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  } as const;
}