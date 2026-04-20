"use client";

import Link from "next/link";
import { useMemo } from "react";

import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, rarityColors, secondaryButton } from "@/components/ui";
import { cards } from "@/data/cards";
import { loadDeck } from "@/lib/deckStorage";
import { getArenaClashSkillForCard } from "@/lib/arenaClashSkillRegistry";
import type { FighterCard } from "@/types/game";

const TEAM_SIZE = 5;

function uniqueCards(list: FighterCard[]): FighterCard[] {
  const seen = new Set<number>();
  const result: FighterCard[] = [];

  for (const card of list) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    result.push(card);
  }

  return result;
}

function fillTeam(base: FighterCard[], pool: FighterCard[], size = TEAM_SIZE): FighterCard[] {
  const result = uniqueCards(base);

  for (const card of pool) {
    if (result.length >= size) break;
    if (result.some((item) => item.id === card.id)) continue;
    result.push(card);
  }

  return result.slice(0, size);
}

function FeatureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        ...glassCard(),
        padding: 16,
        display: "grid",
        gap: 8,
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.92,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.45,
          opacity: 0.74,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default function ArenaClashIntroPage() {
  const team = useMemo(() => fillTeam(loadDeck(), cards), []);

  return (
    <PageShell>
      <main
        style={{
          padding: "16px 16px 120px",
          display: "grid",
          gap: 16,
        }}
      >
        <section
          style={{
            ...glassCard(),
            padding: 18,
            display: "grid",
            gap: 14,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Baki × Kengan
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                lineHeight: 1.02,
                fontWeight: 900,
              }}
            >
              Arena Clash
            </h1>

            <div
              style={{
                maxWidth: 900,
                fontSize: 15,
                lineHeight: 1.5,
                opacity: 0.76,
              }}
            >
              Тактический режим 5 на 5, где ты вручную выбираешь действия бойца.
              Способности прожимаются вручную, но исход каждого размена всё равно
              решают столкновения статов: SPD, INSTINCT, TECH, STR, DEF и DUR.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link href="/battle/arena-clash/versus" style={primaryButton()}>
  Start Arena Clash
</Link>

            <Link href="/battle" style={secondaryButton()}>
              Back to Battle Hub
            </Link>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <FeatureCard
            title="Actions"
            text="Каждый exchange ты выбираешь одно из 5 действий: Strike, Guard, Skill, Switch или Charge."
          />
          <FeatureCard
            title="Resources"
            text="Focus нужен для ручных способностей. Tempo нужен для вывода и смены бойцов."
          />
          <FeatureCard
            title="No HP"
            text="Вместо полосы здоровья используется лестница состояний: Ready → Pressured → Broken → KO."
          />
          <FeatureCard
            title="Stat Truth"
            text="Скиллы не авто-выигрывают бой. Они только меняют конкретный clash и его математику."
          />
        </section>

        <section
          style={{
            ...glassCard(),
            padding: 16,
            display: "grid",
            gap: 14,
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
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Current lineup
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                Your Arena Clash Team
              </div>
            </div>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {team.length}/{TEAM_SIZE} cards
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {team.map((card, index) => {
              const rarity = rarityColors(card.rarity);
              const skill = getArenaClashSkillForCard(card);

              return (
                <div
                  key={card.id}
                  style={{
                    ...glassCard(),
                    padding: 14,
                    display: "grid",
                    gap: 8,
                    border: `1px solid ${rarity.border}`,
                    background: rarity.bg,
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
                          opacity: 0.6,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                        }}
                      >
                        {index === 0 ? "Lead" : `Reserve ${index}`}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                        }}
                      >
                        {card.name}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 800,
                        color: rarity.text,
                        border: `1px solid ${rarity.border}`,
                        background: "rgba(255,255,255,0.05)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {card.rarity}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.72,
                    }}
                  >
                    {card.title}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 12,
                        padding: 8,
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.6 }}>STR</div>
                      <div style={{ fontWeight: 800 }}>{card.stats.STR}</div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 12,
                        padding: 8,
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.6 }}>SPD</div>
                      <div style={{ fontWeight: 800 }}>{card.stats.SPD}</div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 12,
                        padding: 8,
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.6 }}>TECH</div>
                      <div style={{ fontWeight: 800 }}>{card.stats.TECH}</div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 12,
                        padding: 8,
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.6 }}>DEF</div>
                      <div style={{ fontWeight: 800 }}>{card.stats.DEF}</div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 12,
                        padding: 8,
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.6 }}>DUR</div>
                      <div style={{ fontWeight: 800 }}>{card.stats.DUR}</div>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 12,
                        padding: 8,
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.6 }}>INST</div>
                      <div style={{ fontWeight: 800 }}>{card.stats.INSTINCT}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 12,
                      padding: 10,
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 11, opacity: 0.6 }}>Arena Clash Skill</div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>
                      {skill ? skill.name : "Not mapped yet"}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {skill
                        ? `${skill.type} • ${skill.focusCost} Focus`
                        : "This fighter will still work, but Skill action will be unavailable."}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              opacity: 0.68,
            }}
          >
            Если в сохранённой колоде меньше 5 уникальных бойцов, страница автоматически
            добирает состав из общего пула карт.
          </div>
        </section>
      </main>
    </PageShell>
  );
}