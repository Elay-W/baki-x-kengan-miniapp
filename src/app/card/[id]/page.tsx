"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import FighterVisualCard from "@/components/FighterVisualCard";
import PageShell from "@/components/PageShell";
import StatBar from "@/components/StatBar";
import { glassCard, secondaryButton } from "@/components/ui";
import { cards } from "@/data/cards";
import { getOwnedCardsDetailed } from "@/lib/collectionStorage";
import { loadDeck } from "@/lib/deckStorage";

export default function CardDetailPage() {
  const router = useRouter();
  const params = useParams();

  const rawId = params?.id;
  const cardId = Array.isArray(rawId) ? Number(rawId[0]) : Number(rawId);

  const safeCard = useMemo(() => {
    return cards.find((card) => card.id === cardId) ?? null;
  }, [cardId]);

  const ownedCards = useMemo(() => getOwnedCardsDetailed(), []);
  const deck = useMemo(() => loadDeck(), []);

  const owned = useMemo(() => {
    if (!safeCard) return false;
    return ownedCards.some((card) => card.id === safeCard.id);
  }, [ownedCards, safeCard]);

  const copies = useMemo(() => {
    if (!safeCard) return 0;
    return ownedCards.find((card) => card.id === safeCard.id)?.copies ?? 0;
  }, [ownedCards, safeCard]);

  const inDeck = useMemo(() => {
    if (!safeCard) return false;
    return deck.some((card) => card.id === safeCard.id);
  }, [deck, safeCard]);

  if (!safeCard) {
    return (
      <PageShell
        playerName="Underground Fighter"
        level={12}
        yen={24500}
        tokens={180}
      >
        <section
          style={{
            ...glassCard(),
            padding: 18,
            display: "grid",
            gap: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(8,8,12,0.76)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Fighter not found
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              opacity: 0.72,
            }}
          >
            This card does not exist in the current roster.
          </div>

          <button
            type="button"
            onClick={() => router.push("/collection")}
            style={secondaryButton()}
          >
            Back to Collection
          </button>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell
      playerName="Underground Fighter"
      level={12}
      yen={24500}
      tokens={180}
    >
      <section
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            ...secondaryButton(),
            width: "fit-content",
          }}
        >
          Back
        </button>

        <FighterVisualCard
          card={safeCard}
          label={safeCard.universe}
          compact={false}
          imageSrc={`/fighters/${safeCard.id}.png`}
          copies={owned ? copies : undefined}
          stateLabel={inDeck ? "In deck" : owned ? "Owned" : "Not owned"}
          actionSlot={
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {owned ? `Owned x${copies}` : "Not owned"}
              </div>

              <div
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {inDeck ? "In deck" : "Not in deck"}
              </div>
            </div>
          }
        />
      </section>

      <section
        style={{
          ...glassCard(),
          padding: 16,
          display: "grid",
          gap: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.76)",
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
            Overview
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Fighter Profile
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6 }}>Name</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>
              {safeCard.name}
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6 }}>Title</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>
              {safeCard.title}
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6 }}>Rarity</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>
              {safeCard.rarity}
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6 }}>Stars</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>
              {safeCard.stars}★
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6 }}>Universe</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>
              {safeCard.universe}
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.6 }}>Type</div>
            <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>
              {safeCard.type}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          ...glassCard(),
          padding: 16,
          display: "grid",
          gap: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.76)",
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
            Stats
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Combat Parameters
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <StatBar label="STR" value={safeCard.stats.STR} />
          <StatBar label="SPD" value={safeCard.stats.SPD} />
          <StatBar label="TECH" value={safeCard.stats.TECH} />
          <StatBar label="DEF" value={safeCard.stats.DEF} />
          <StatBar label="DUR" value={safeCard.stats.DUR} />
          <StatBar label="INSTINCT" value={safeCard.stats.INSTINCT} />
        </div>
      </section>

      <section
        style={{
          ...glassCard(),
          padding: 16,
          display: "grid",
          gap: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.76)",
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
            Extended Description
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Lore & Notes
          </div>
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            opacity: 0.78,
          }}
        >
          This section is ready for expanded lore, matchup notes, special ability text,
          anime/manga context, and future progression or collection metadata.
        </div>
      </section>
    </PageShell>
  );
}