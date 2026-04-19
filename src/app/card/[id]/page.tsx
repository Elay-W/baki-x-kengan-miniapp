"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import {
  glassCard,
  primaryButton,
  rarityColors,
  secondaryButton,
  statColor,
} from "@/components/ui";
import { cards } from "@/data/cards";
import { addCardToSavedDeck, loadDeck } from "@/lib/deckStorage";
import { hasOwnedCard } from "@/lib/collectionStorage";
import type { FighterCard } from "@/types/game";

function StatPill({
  label,
  value,
}: {
  label: keyof FighterCard["stats"];
  value: number;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{label}</div>
      <div
        style={{
          marginTop: 4,
          fontSize: 18,
          fontWeight: 800,
          color: statColor(value),
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function CardDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [message, setMessage] = useState("");

  const cardId = Number(params?.id);

  const card = useMemo(() => {
    if (!Number.isFinite(cardId)) return undefined;
    return cards.find((item) => item.id === cardId);
  }, [cardId]);

  const currentDeck = useMemo(() => loadDeck(), []);

  if (!card) {
    return (
      <PageShell>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ ...glassCard(), padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 900 }}>Card Not Found</div>
            <div
              style={{
                marginTop: 10,
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.5,
              }}
            >
              This fighter card does not exist or the URL is invalid.
            </div>

            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <button onClick={() => router.push("/collection")} style={primaryButton()}>
                Back to Collection
              </button>
              <button onClick={() => router.push("/")} style={secondaryButton()}>
                Back Home
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const safeCard = card;
  const tone = rarityColors(safeCard.rarity);
  const inDeck = currentDeck.some((item) => item.id === safeCard.id);
  const owned = hasOwnedCard(safeCard.id);

  function handleAddToDeck() {
    const result = addCardToSavedDeck(safeCard.id);

    if (result.ok) {
      setMessage(`${safeCard.name} added to deck.`);
      return;
    }

    if (result.reason === "duplicate") {
      setMessage("This fighter is already in your deck.");
      return;
    }

    if (result.reason === "full") {
      setMessage("Deck is already full.");
      return;
    }

    if (result.reason === "not_owned") {
      setMessage("You do not own this fighter.");
      return;
    }

    if (result.reason === "not_found") {
      setMessage("This fighter could not be found.");
      return;
    }

    setMessage("Unable to add this fighter to the deck.");
  }

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            ...glassCard(),
            padding: 18,
            border: `1px solid ${tone.border}`,
            background: tone.bg,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: tone.text,
                }}
              >
                {safeCard.universe}
              </div>

              <div style={{ marginTop: 10, fontSize: 32, fontWeight: 950 }}>
                {safeCard.name}
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "rgba(255,255,255,0.76)",
                  lineHeight: 1.5,
                }}
              >
                {safeCard.title}
              </div>
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.18)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontWeight: 900,
              }}
            >
              {safeCard.stars}★
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {safeCard.rarity}
            </span>

            <span
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {safeCard.type}
            </span>

            <span
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background: owned ? "rgba(34,197,94,0.14)" : "rgba(255,255,255,0.05)",
                border: owned
                  ? "1px solid rgba(34,197,94,0.28)"
                  : "1px solid rgba(255,255,255,0.08)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {owned ? "Owned" : "Not owned"}
            </span>

            <span
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background: inDeck ? "rgba(250,204,21,0.14)" : "rgba(255,255,255,0.05)",
                border: inDeck
                  ? "1px solid rgba(250,204,21,0.28)"
                  : "1px solid rgba(255,255,255,0.08)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {inDeck ? "In deck" : "Not in deck"}
            </span>
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Special Skill</div>
          <div
            style={{
              marginTop: 12,
              padding: "14px 16px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.82)",
              lineHeight: 1.5,
            }}
          >
            {safeCard.skill}
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Stats</div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <StatPill label="STR" value={safeCard.stats.STR} />
            <StatPill label="SPD" value={safeCard.stats.SPD} />
            <StatPill label="TECH" value={safeCard.stats.TECH} />
            <StatPill label="DUR" value={safeCard.stats.DUR} />
            <StatPill label="DEF" value={safeCard.stats.DEF} />
            <StatPill label="INSTINCT" value={safeCard.stats.INSTINCT} />
          </div>
        </div>

        <div style={{ ...glassCard(), padding: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <button
              onClick={handleAddToDeck}
              disabled={!owned || inDeck}
              style={{
                ...primaryButton(),
                opacity: !owned || inDeck ? 0.6 : 1,
              }}
            >
              {inDeck ? "Already in Deck" : "Add to Deck"}
            </button>

            <button
              onClick={() => router.push("/collection")}
              style={secondaryButton()}
            >
              Back to Collection
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              color: message ? "#86efac" : "rgba(255,255,255,0.68)",
            }}
          >
            {message || "Manage this fighter from the card details screen."}
          </div>
        </div>
      </div>
    </PageShell>
  );
}