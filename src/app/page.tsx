"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Screen =
  | "home"
  | "collection"
  | "battle"
  | "shop"
  | "decks"
  | "profile"
  | "card";

type CardType = "Powerhouse" | "Tank" | "Speedster" | "Technician" | "Wildcard";
type Universe = "Baki" | "Kengan";
type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Elite"
  | "Legendary"
  | "God-like";

type FighterCard = {
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

const cards: FighterCard[] = [
  {
    id: 1,
    name: "Yujiro Hanma",
    title: "The Strongest Creature",
    universe: "Baki",
    rarity: "God-like",
    stars: 7,
    type: "Wildcard",
    skill: "Demon Pressure — weakens the enemy’s best stat at the start of battle.",
    stats: { STR: 100, SPD: 98, TECH: 97, DUR: 99, DEF: 95, INSTINCT: 99 },
  },
  {
    id: 2,
    name: "Shen Wulong",
    title: "The Connector",
    universe: "Kengan",
    rarity: "God-like",
    stars: 7,
    type: "Wildcard",
    skill: "Connector Sync — copies the enemy’s best current stat once per fight.",
    stats: { STR: 96, SPD: 95, TECH: 100, DUR: 93, DEF: 98, INSTINCT: 100 },
  },
  {
    id: 3,
    name: "Baki Hanma",
    title: "The Adaptive Fighter",
    universe: "Baki",
    rarity: "Legendary",
    stars: 6,
    type: "Wildcard",
    skill: "Adaptive Burst — gains a temporary stat boost after losing an exchange.",
    stats: { STR: 92, SPD: 98, TECH: 93, DUR: 91, DEF: 88, INSTINCT: 98 },
  },
  {
    id: 4,
    name: "Tokita Ohma",
    title: "The Ashura",
    universe: "Kengan",
    rarity: "Legendary",
    stars: 6,
    type: "Wildcard",
    skill: "Advance / Demonsbane — burst power with counter potential.",
    stats: { STR: 89, SPD: 91, TECH: 95, DUR: 83, DEF: 88, INSTINCT: 96 },
  },
  {
    id: 5,
    name: "Kuroki Gensai",
    title: "The Devil Lance",
    universe: "Kengan",
    rarity: "Legendary",
    stars: 6,
    type: "Technician",
    skill: "Devil Lance — attacks pierce a large part of enemy defense.",
    stats: { STR: 90, SPD: 72, TECH: 100, DUR: 90, DEF: 94, INSTINCT: 95 },
  },
  {
    id: 6,
    name: "Wakatsuki Takeshi",
    title: "The Wild Tiger",
    universe: "Kengan",
    rarity: "Elite",
    stars: 5,
    type: "Tank",
    skill: "Blast Core — one devastating heavy strike with stun chance.",
    stats: { STR: 97, SPD: 58, TECH: 69, DUR: 100, DEF: 93, INSTINCT: 79 },
  },
  {
    id: 7,
    name: "Jack Hanma",
    title: "The Monster Biter",
    universe: "Baki",
    rarity: "Legendary",
    stars: 6,
    type: "Powerhouse",
    skill: "Goudou — repeated hits apply bleed and pressure.",
    stats: { STR: 98, SPD: 72, TECH: 71, DUR: 98, DEF: 84, INSTINCT: 80 },
  },
  {
    id: 8,
    name: "Gaolang Wongsawat",
    title: "The Thai God of War",
    universe: "Kengan",
    rarity: "Elite",
    stars: 5,
    type: "Speedster",
    skill: "Flash Combination — extra pressure when acting first.",
    stats: { STR: 79, SPD: 90, TECH: 84, DUR: 68, DEF: 77, INSTINCT: 86 },
  },
];

const rarityOrder: Rarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Elite",
  "Legendary",
  "God-like",
];

function rarityColors(rarity: Rarity) {
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

function statColor(value: number) {
  if (value >= 95) return "#ef4444";
  if (value >= 85) return "#fb923c";
  if (value >= 70) return "#facc15";
  if (value >= 55) return "#84cc16";
  return "#71717a";
}

function cardStyle() {
  return {
    background: "rgba(10,10,10,0.72)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
  } as const;
}

function primaryButton() {
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

function secondaryButton() {
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

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#d4d4d8" }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div
        style={{
          width: "100%",
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: "#27272a",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            borderRadius: 999,
            background: statColor(value),
          }}
        />
      </div>
    </div>
  );
}

function SplashScreen({ progress }: { progress: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at center, rgba(255,90,0,0.16), transparent 30%), radial-gradient(circle at 20% 20%, rgba(255,190,60,0.10), transparent 22%), radial-gradient(circle at 80% 30%, rgba(120,0,255,0.12), transparent 20%), #000",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            marginBottom: 24,
            overflow: "hidden",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 0 60px rgba(255,120,0,0.18)",
          }}
        >
          <Image
            src="/welcome-banner.png"
            alt="Baki X Kengan"
            width={900}
            height={900}
            style={{ display: "block", width: "100%", maxWidth: 320, height: "auto" }}
            priority
          />
        </div>

        <div style={{ fontSize: 36, fontWeight: 700, color: "#fff" }}>Baki X Kengan</div>
        <div style={{ marginTop: 10, fontSize: 14, color: "#a1a1aa", maxWidth: 320 }}>
          Initializing the arena, syncing fighters, loading interface...
        </div>

        <div style={{ marginTop: 28, width: "100%", maxWidth: 280 }}>
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#71717a",
            }}
          >
            <span>Loading</span>
            <span>{progress}%</span>
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 999,
              overflow: "hidden",
              background: "#18181b",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 999,
                background: "#fff",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 30,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid #3f3f46",
            borderTopColor: "#ffffff",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    </div>
  );
}

function BottomNav({
  screen,
  setScreen,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}) {
  const items: { key: Screen; label: string }[] = [
    { key: "home", label: "Home" },
    { key: "collection", label: "Collection" },
    { key: "battle", label: "Battle" },
    { key: "shop", label: "Shop" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        display: "flex",
        justifyContent: "center",
        padding: "0 16px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          padding: 10,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
      >
        {items.map((item) => {
          const active = screen === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setScreen(item.key)}
              style={{
                padding: "12px 10px",
                borderRadius: 16,
                border: "none",
                background: active ? "#ffffff" : "rgba(255,255,255,0.04)",
                color: active ? "#000000" : "#d4d4d8",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedCard, setSelectedCard] = useState<FighterCard | null>(cards[0]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(8);
  const [query, setQuery] = useState("");
  const [universeFilter, setUniverseFilter] = useState<Universe | "All">("All");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "All">("All");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : Math.min(prev + 7, 100)));
    }, 120);

    const timeout = setTimeout(() => {
      setProgress(100);
      setLoading(false);
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const filteredCards = useMemo(() => {
    return cards
      .filter((card) =>
        query.trim()
          ? card.name.toLowerCase().includes(query.toLowerCase()) ||
            card.title.toLowerCase().includes(query.toLowerCase())
          : true
      )
      .filter((card) => (universeFilter === "All" ? true : card.universe === universeFilter))
      .filter((card) => (rarityFilter === "All" ? true : card.rarity === rarityFilter))
      .sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
  }, [query, universeFilter, rarityFilter]);

  const activeDeck = ["Yujiro Hanma", "Baki Hanma", "Tokita Ohma", "Kuroki Gensai", "Wakatsuki Takeshi"];

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <main
  style={{
    minHeight: "100vh",
    color: "#fff",
    backgroundImage:
      "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.82)), url('/bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  }}
>
        {!loading && (
          <>
            <div
              style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                padding: "24px 16px 120px",
              }}
            >
              <div style={{ width: "100%", maxWidth: 420 }}>
                {screen === "home" && (
                  <>
                    <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.05 }}>Baki X Kengan</div>
                        <div style={{ marginTop: 10, fontSize: 16, color: "#a1a1aa", lineHeight: 1.5 }}>
                          Collect fighter cards, build your deck, and dominate the arena.
                        </div>
                      </div>
                      <button style={secondaryButton()} onClick={() => setScreen("profile")}>
                        Profile
                      </button>
                    </div>

                    <div style={{ ...cardStyle(), padding: 20, marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, color: "#a1a1aa" }}>Current deck</div>
                          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700 }}>Main Arena Deck</div>
                        </div>
                        <button style={secondaryButton()} onClick={() => setScreen("decks")}>
                          Open
                        </button>
                      </div>

                      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {activeDeck.map((name) => (
                          <span
                            key={name}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.10)",
                              background: "rgba(255,255,255,0.04)",
                              fontSize: 12,
                              color: "#d4d4d8",
                            }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        ["Collection", "Browse your fighters and rarities", "collection"],
                        ["Decks", "Manage your battle-ready builds", "decks"],
                        ["Battle", "Choose a mode and enter the arena", "battle"],
                        ["Shop", "Open packs and get new cards", "shop"],
                      ].map(([title, subtitle, target]) => (
                        <button
                          key={title}
                          onClick={() => setScreen(target as Screen)}
                          style={{
                            ...cardStyle(),
                            padding: 18,
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
                          <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa", lineHeight: 1.45 }}>
                            {subtitle}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div style={{ ...cardStyle(), padding: 20, marginTop: 16 }}>
                      <div style={{ fontSize: 13, color: "#a1a1aa" }}>Daily focus</div>
                      <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>
                        Win 3 battles • Open 1 pack • Add 1 card to favourites
                      </div>
                    </div>
                  </>
                )}

                {screen === "collection" && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 32, fontWeight: 700 }}>Collection</div>
                      <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
                        {filteredCards.length} cards shown
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search fighter..."
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 16,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          color: "#fff",
                          outline: "none",
                        }}
                      />

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <select
                          value={universeFilter}
                          onChange={(e) => setUniverseFilter(e.target.value as Universe | "All")}
                          style={{
                            padding: "14px 16px",
                            borderRadius: 16,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#fff",
                          }}
                        >
                          <option value="All">All universes</option>
                          <option value="Baki">Baki</option>
                          <option value="Kengan">Kengan</option>
                        </select>

                        <select
                          value={rarityFilter}
                          onChange={(e) => setRarityFilter(e.target.value as Rarity | "All")}
                          style={{
                            padding: "14px 16px",
                            borderRadius: 16,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#fff",
                          }}
                        >
                          <option value="All">All rarities</option>
                          {rarityOrder.map((rarity) => (
                            <option key={rarity} value={rarity}>
                              {rarity}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {filteredCards.map((card) => {
                        const tone = rarityColors(card.rarity);
                        return (
                          <button
                            key={card.id}
                            onClick={() => {
                              setSelectedCard(card);
                              setScreen("card");
                            }}
                            style={{
                              padding: 16,
                              textAlign: "left",
                              cursor: "pointer",
                              borderRadius: 24,
                              border: `1px solid ${tone.border}`,
                              background: tone.bg,
                              color: "#fff",
                            }}
                          >
                            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#d4d4d8" }}>
                              {card.universe}
                            </div>
                            <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>{card.name}</div>
                            <div style={{ marginTop: 4, fontSize: 13, color: "#d4d4d8", lineHeight: 1.35 }}>
                              {card.title}
                            </div>

                            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                              <span
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  background: "rgba(0,0,0,0.18)",
                                  color: tone.text,
                                }}
                              >
                                {card.rarity}
                              </span>
                              <span>{card.stars}★</span>
                            </div>

                            <div style={{ marginTop: 12, fontSize: 12, color: "#d4d4d8" }}>{card.type}</div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {screen === "card" && selectedCard && (
                  <>
                    <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 30, fontWeight: 700 }}>{selectedCard.name}</div>
                        <div style={{ marginTop: 8, fontSize: 16, color: "#a1a1aa" }}>{selectedCard.title}</div>
                      </div>
                      <button style={secondaryButton()} onClick={() => setScreen("collection")}>
                        Back
                      </button>
                    </div>

                    {(() => {
                      const tone = rarityColors(selectedCard.rarity);
                      return (
                        <div
                          style={{
                            padding: 20,
                            borderRadius: 28,
                            border: `1px solid ${tone.border}`,
                            background: tone.bg,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#d4d4d8" }}>
                                {selectedCard.universe}
                              </div>
                              <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>
                                {selectedCard.rarity} • {selectedCard.stars}★
                              </div>
                            </div>

                            <div
                              style={{
                                alignSelf: "flex-start",
                                padding: "8px 12px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(0,0,0,0.18)",
                                fontSize: 13,
                              }}
                            >
                              {selectedCard.type}
                            </div>
                          </div>

                          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <StatBar label="STR" value={selectedCard.stats.STR} />
                            <StatBar label="SPD" value={selectedCard.stats.SPD} />
                            <StatBar label="TECH" value={selectedCard.stats.TECH} />
                            <StatBar label="DUR" value={selectedCard.stats.DUR} />
                            <StatBar label="DEF" value={selectedCard.stats.DEF} />
                            <StatBar label="INSTINCT" value={selectedCard.stats.INSTINCT} />
                          </div>

                          <div
                            style={{
                              marginTop: 18,
                              padding: 16,
                              borderRadius: 18,
                              border: "1px solid rgba(255,255,255,0.10)",
                              background: "rgba(0,0,0,0.20)",
                            }}
                          >
                            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a1a1aa" }}>
                              Special Skill
                            </div>
                            <div style={{ marginTop: 10, fontSize: 14, color: "#e4e4e7", lineHeight: 1.5 }}>
                              {selectedCard.skill}
                            </div>
                          </div>

                          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <button style={primaryButton()}>Add to Deck</button>
                            <button style={secondaryButton()}>Favourite</button>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {screen === "decks" && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 32, fontWeight: 700 }}>Decks</div>
                      <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
                        Your saved loadouts for different battle styles
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 14 }}>
                      <div style={{ ...cardStyle(), padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 26, fontWeight: 700 }}>Main Arena Deck</div>
                            <div style={{ marginTop: 6, fontSize: 14, color: "#a1a1aa" }}>
                              Wildcard / Control / Heavy finishers
                            </div>
                          </div>
                          <span
                            style={{
                              alignSelf: "flex-start",
                              padding: "8px 12px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.10)",
                              background: "rgba(255,255,255,0.04)",
                              fontSize: 12,
                            }}
                          >
                            Active
                          </span>
                        </div>

                        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {activeDeck.map((name) => (
                            <span
                              key={name}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(255,255,255,0.04)",
                                fontSize: 12,
                                color: "#d4d4d8",
                              }}
                            >
                              {name}
                            </span>
                          ))}
                        </div>

                        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <button style={primaryButton()}>Edit Deck</button>
                          <button style={secondaryButton()}>Duplicate</button>
                        </div>
                      </div>

                      <div
                        style={{
                          ...cardStyle(),
                          padding: 20,
                          borderStyle: "dashed",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 700 }}>+ Create New Deck</div>
                        <div style={{ marginTop: 8, fontSize: 14, color: "#71717a" }}>
                          Next step: we’ll turn this into a full deck builder.
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {screen === "battle" && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 32, fontWeight: 700 }}>Battle Hub</div>
                      <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
                        Choose your mode and step into the arena
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 14 }}>
                      {[
                        ["Ranked", "Climb, test your best deck, earn status"],
                        ["Casual", "Fast fights without pressure"],
                        ["Training", "Test cards, timing and matchups"],
                      ].map(([title, subtitle]) => (
                        <button key={title} style={{ ...cardStyle(), padding: 20, textAlign: "left", cursor: "pointer" }}>
                          <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
                          <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa", lineHeight: 1.45 }}>
                            {subtitle}
                          </div>
                        </button>
                      ))}

                      <div style={{ ...cardStyle(), padding: 20, borderStyle: "dashed" }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>Events</div>
                        <div style={{ marginTop: 8, fontSize: 14, color: "#71717a" }}>Coming soon</div>
                      </div>
                    </div>
                  </>
                )}

                {screen === "shop" && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 32, fontWeight: 700 }}>Shop</div>
                      <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
                        Packs, banners and future event drops
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 14 }}>
                      <div
                        style={{
                          padding: 20,
                          borderRadius: 24,
                          border: "1px solid rgba(251,146,60,0.35)",
                          background: "rgba(154,52,18,0.18)",
                        }}
                      >
                        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fdba74" }}>
                          Featured
                        </div>
                        <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>Arena Legends Pack</div>
                        <div style={{ marginTop: 8, fontSize: 14, color: "#d4d4d8", lineHeight: 1.45 }}>
                          Higher chance for Legendary and Elite fighters.
                        </div>
                        <button style={{ ...primaryButton(), marginTop: 18 }}>Open Pack</button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ ...cardStyle(), padding: 18 }}>
                          <div style={{ fontSize: 14, color: "#a1a1aa" }}>Standard Pack</div>
                          <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>100 Coins</div>
                        </div>
                        <div style={{ ...cardStyle(), padding: 18 }}>
                          <div style={{ fontSize: 14, color: "#a1a1aa" }}>Elite Banner</div>
                          <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>350 Coins</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {screen === "profile" && (
                  <>
                    <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 32, fontWeight: 700 }}>Profile</div>
                        <div style={{ marginTop: 8, fontSize: 14, color: "#a1a1aa" }}>
                          Player identity, progression and stats
                        </div>
                      </div>
                      <button style={secondaryButton()} onClick={() => setScreen("home")}>
                        Back
                      </button>
                    </div>

                    <div style={{ ...cardStyle(), padding: 20 }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 22,
                            background: "#ffffff",
                            color: "#000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            fontSize: 22,
                          }}
                        >
                          BX
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700 }}>Arena Player</div>
                          <div style={{ marginTop: 4, fontSize: 14, color: "#a1a1aa" }}>@telegram_user</div>
                        </div>
                      </div>

                      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ ...cardStyle(), padding: 16 }}>
                          <div style={{ fontSize: 13, color: "#a1a1aa" }}>Collection</div>
                          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>8 / 100</div>
                        </div>
                        <div style={{ ...cardStyle(), padding: 16 }}>
                          <div style={{ fontSize: 13, color: "#a1a1aa" }}>Decks</div>
                          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>1</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <BottomNav screen={screen} setScreen={setScreen} />
          </>
        )}

        {loading && <SplashScreen progress={progress} />}
      </main>
    </>
  );
}