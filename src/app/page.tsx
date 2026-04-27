"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton, rarityColors } from "@/components/ui";
import { loadDeck } from "@/lib/deckStorage";
import type { FighterCard } from "@/types/game";

function ActionTile({
  title,
  subtitle,
  href,
  badge,
}: {
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        ...glassCard(),
        padding: 16,
        display: "grid",
        gap: 10,
        minHeight: 132,
        textDecoration: "none",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(10,10,14,0.68)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "start",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          {title}
        </div>

        {badge && (
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.45,
          opacity: 0.76,
        }}
      >
        {subtitle}
      </div>
    </Link>
  );
}

function MiniDeckCard({ card }: { card: FighterCard }) {
  const rarity = rarityColors(card.rarity);

  return (
    <div
      style={{
        ...glassCard(),
        padding: 12,
        display: "grid",
        gap: 6,
        border: `1px solid ${rarity.border}`,
        background: "rgba(10,10,14,0.72)",
        backdropFilter: "blur(12px)",
        minHeight: 96,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "start",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          {card.name}
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: rarity.text,
            whiteSpace: "nowrap",
          }}
        >
          {card.stars}★
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          opacity: 0.72,
          lineHeight: 1.3,
        }}
      >
        {card.title}
      </div>

      <div
        style={{
          fontSize: 11,
          opacity: 0.62,
        }}
      >
        {card.rarity}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [deck, setDeck] = useState<FighterCard[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setDeck(loadDeck());
    setIsHydrated(true);
  }, []);

  const deckPreview = useMemo(() => deck.slice(0, 3), [deck]);

  return (
    <PageShell
      playerName="Underground Fighter"
      yen={24500}
      tokens={180}
      backgroundImageSrc="/backgrounds/home-menu-bg.jpg"
      backgroundOverlay="linear-gradient(180deg, rgba(4,5,8,0.56) 0%, rgba(4,5,8,0.48) 22%, rgba(4,5,8,0.62) 50%, rgba(4,5,8,0.84) 100%)"
    >
      <section
        style={{
          ...glassCard(),
          padding: 18,
          display: "grid",
          gap: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.58)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Baki × Kengan
          </div>

          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              lineHeight: 0.96,
            }}
          >
            Enter the Arena
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              opacity: 0.78,
              maxWidth: 360,
            }}
          >
            Build your fighters, open packs, and dominate the underground scene.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link href="/battle" style={primaryButton()}>
            Start Battle
          </Link>

          <Link href="/collection" style={secondaryButton()}>
            Open Collection
          </Link>
        </div>
      </section>

      <section
        style={{
          ...glassCard(),
          padding: 16,
          display: "grid",
          gap: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.6)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Main Team
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Saved Arena Deck
            </div>
          </div>

          <Link href="/deck" style={secondaryButton()}>
            Manage Deck
          </Link>
        </div>

        {isHydrated && deck.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {deckPreview.map((card) => (
              <MiniDeckCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 18,
              padding: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 14,
              opacity: 0.74,
              lineHeight: 1.45,
            }}
          >
            {isHydrated
              ? "No saved deck yet. Go to Deck and build a 5-card team."
              : "Loading your saved deck from local storage."}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {isHydrated &&
            deck.slice(0, 5).map((card) => (
              <div
                key={`chip-${card.id}`}
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {card.name}
              </div>
            ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <ActionTile
          title="Collection"
          subtitle="Browse owned fighters and inspect cards."
          href="/collection"
        />
        <ActionTile
          title="Deck"
          subtitle="Build your main lineup and prepare for battle."
          href="/deck"
        />
        <ActionTile
          title="Battle"
          subtitle="Choose between Auto Arena and Arena Clash."
          href="/battle"
          badge="Live"
        />
        <ActionTile
          title="Shop"
          subtitle="Open packs, spend Yen, and chase rare drops."
          href="/shop"
          badge="New"
        />
      </section>

      <section
        style={{
          ...glassCard(),
          padding: 16,
          display: "grid",
          gap: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.6)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          Daily Focus
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          Win 3 battles • Open 1 pack • Add 1 card to favorites
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.45,
            opacity: 0.74,
          }}
        >
          Keep the main screen fast, readable, and action-first. More progression widgets
          can be added later without turning this page into a long scroll.
        </div>
      </section>
    </PageShell>
  );
}