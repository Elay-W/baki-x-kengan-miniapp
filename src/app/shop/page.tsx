"use client";

import { useMemo, useState } from "react";

import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton } from "@/components/ui";

type ShopTab = "packs" | "currency" | "offers";

type PackItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  currency: "yen" | "tokens";
  accent: string;
  badge?: string;
};

type CurrencyBundle = {
  id: string;
  title: string;
  amount: string;
  priceText: string;
  accent: string;
};

function TabChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 12px",
        borderRadius: 999,
        border: active
          ? "1px solid rgba(255,255,255,0.16)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active ? "#ffffff" : "rgba(255,255,255,0.04)",
        color: active ? "#000000" : "#ffffff",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function CurrencyBadge({
  kind,
  value,
}: {
  kind: "yen" | "tokens";
  value: number | string;
}) {
  const isYen = kind === "yen";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${
          isYen ? "rgba(217,164,65,0.45)" : "rgba(177,30,50,0.5)"
        }`,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      <img
        src={isYen ? "/currency/yen.png" : "/currency/purgatory-token.png"}
        alt={isYen ? "Yen" : "Purgatory Tokens"}
        style={{
          width: 20,
          height: 20,
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
      />
      {value}
    </div>
  );
}

function PackCard({ item }: { item: PackItem }) {
  return (
    <div
      style={{
        ...glassCard(),
        padding: 16,
        display: "grid",
        gap: 14,
        minHeight: 220,
        border: `1px solid ${item.accent}`,
        background: `linear-gradient(180deg, ${item.accent}18, rgba(8,8,12,0.78))`,
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
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.62,
            }}
          >
            Pack
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1,
              marginTop: 6,
            }}
          >
            {item.title}
          </div>
        </div>

        {item.badge && (
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
            {item.badge}
          </div>
        )}
      </div>

      <div
        style={{
          borderRadius: 18,
          minHeight: 88,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "grid",
          placeItems: "center",
          fontSize: 14,
          fontWeight: 800,
          opacity: 0.72,
          textAlign: "center",
          padding: 12,
        }}
      >
        Pack art placeholder
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.45,
          opacity: 0.76,
        }}
      >
        {item.subtitle}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <CurrencyBadge kind={item.currency} value={item.price.toLocaleString("en-US")} />
        <button type="button" style={primaryButton()}>
          Open
        </button>
      </div>
    </div>
  );
}

function CurrencyCard({ item, kind }: { item: CurrencyBundle; kind: "yen" | "tokens" }) {
  return (
    <div
      style={{
        ...glassCard(),
        padding: 16,
        display: "grid",
        gap: 12,
        border: `1px solid ${item.accent}`,
        background: `linear-gradient(180deg, ${item.accent}16, rgba(8,8,12,0.78))`,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          Bundle
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            marginTop: 6,
          }}
        >
          {item.title}
        </div>
      </div>

      <CurrencyBadge kind={kind} value={item.amount} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            opacity: 0.84,
          }}
        >
          {item.priceText}
        </div>

        <button type="button" style={secondaryButton()}>
          Buy
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [tab, setTab] = useState<ShopTab>("packs");

  const packs = useMemo<PackItem[]>(
    () => [
      {
        id: "street-pack",
        title: "Street Pack",
        subtitle: "A basic underground starter pack for building your early collection.",
        price: 5000,
        currency: "yen",
        accent: "rgba(141,148,158,0.45)",
      },
      {
        id: "arena-pack",
        title: "Arena Pack",
        subtitle: "Built for fighters entering the arena with stronger odds for higher rarities.",
        price: 12000,
        currency: "yen",
        accent: "rgba(47,111,219,0.5)",
        badge: "Featured",
      },
      {
        id: "kengan-pack",
        title: "Kengan Pack",
        subtitle: "A corporate-grade recruitment pack with improved high-tier potential.",
        price: 30000,
        currency: "yen",
        accent: "rgba(160,59,224,0.5)",
      },
      {
        id: "purgatory-pack",
        title: "Purgatory Pack",
        subtitle: "Elite selection from Purgatory with premium rarity access.",
        price: 250,
        currency: "tokens",
        accent: "rgba(215,38,61,0.52)",
        badge: "Premium",
      },
      {
        id: "ogre-pack",
        title: "Ogre Pack",
        subtitle: "Top-tier event pack with the highest pressure and strongest pull fantasy.",
        price: 500,
        currency: "tokens",
        accent: "rgba(242,182,50,0.55)",
        badge: "Limited",
      },
    ],
    [],
  );

  const yenBundles = useMemo<CurrencyBundle[]>(
    () => [
      {
        id: "yen-1",
        title: "Stash",
        amount: "20,000",
        priceText: "60 Tokens",
        accent: "rgba(217,164,65,0.45)",
      },
      {
        id: "yen-2",
        title: "Vault",
        amount: "60,000",
        priceText: "150 Tokens",
        accent: "rgba(217,164,65,0.45)",
      },
      {
        id: "yen-3",
        title: "Treasury",
        amount: "150,000",
        priceText: "320 Tokens",
        accent: "rgba(217,164,65,0.45)",
      },
    ],
    [],
  );

  const tokenBundles = useMemo<CurrencyBundle[]>(
    () => [
      {
        id: "token-1",
        title: "Initiate",
        amount: "80",
        priceText: "$1.99",
        accent: "rgba(177,30,50,0.52)",
      },
      {
        id: "token-2",
        title: "Contender",
        amount: "250",
        priceText: "$4.99",
        accent: "rgba(177,30,50,0.52)",
      },
      {
        id: "token-3",
        title: "Champion",
        amount: "700",
        priceText: "$11.99",
        accent: "rgba(177,30,50,0.52)",
      },
    ],
    [],
  );

  return (
    <PageShell
  playerName="Underground Fighter"
  yen={24500}
  tokens={180}
>
      <section
        style={{
          ...glassCard(),
          padding: 16,
          display: "grid",
          gap: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,12,0.76)",
          position: "sticky",
          top: "calc(max(8px, env(safe-area-inset-top)) + 86px)",
          zIndex: 15,
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
              Shop
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Underground Market
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <CurrencyBadge kind="yen" value="24,500" />
            <CurrencyBadge kind="tokens" value="180" />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          <TabChip label="Packs" active={tab === "packs"} onClick={() => setTab("packs")} />
          <TabChip
            label="Currency"
            active={tab === "currency"}
            onClick={() => setTab("currency")}
          />
          <TabChip label="Offers" active={tab === "offers"} onClick={() => setTab("offers")} />
        </div>
      </section>

      {tab === "packs" && (
        <>
          <section
            style={{
              ...glassCard(),
              padding: 16,
              display: "grid",
              gap: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(8,8,12,0.76)",
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
              Featured
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              Purgatory Pack
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.45,
                opacity: 0.76,
              }}
            >
              Premium drop table, elite rarity pressure, and a cleaner premium shop identity.
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <CurrencyBadge kind="tokens" value="250" />
              <button type="button" style={primaryButton()}>
                Open Featured Pack
              </button>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {packs.map((item) => (
              <PackCard key={item.id} item={item} />
            ))}
          </section>
        </>
      )}

      {tab === "currency" && (
        <>
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
                Yen
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                Trade Tokens for Yen
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {yenBundles.map((item) => (
                <CurrencyCard key={item.id} item={item} kind="yen" />
              ))}
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
                Purgatory Tokens
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                Premium Currency
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {tokenBundles.map((item) => (
                <CurrencyCard key={item.id} item={item} kind="tokens" />
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "offers" && (
        <section
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              ...glassCard(),
              padding: 16,
              display: "grid",
              gap: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(8,8,12,0.76)",
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
              Daily Offer
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>Arena Starter Deal</div>
            <div style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.76 }}>
              1 Arena Pack + 10,000 Yen + bonus materials placeholder.
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <CurrencyBadge kind="tokens" value="120" />
              <button type="button" style={primaryButton()}>
                Claim Deal
              </button>
            </div>
          </div>

          <div
            style={{
              ...glassCard(),
              padding: 16,
              display: "grid",
              gap: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(8,8,12,0.76)",
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
              Limited Offer
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>Ogre Access Bundle</div>
            <div style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.76 }}>
              1 Ogre Pack ticket and a premium currency bonus for event launches.
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <CurrencyBadge kind="tokens" value="480" />
              <button type="button" style={primaryButton()}>
                View Bundle
              </button>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}