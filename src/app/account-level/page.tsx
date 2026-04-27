"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton } from "@/components/ui";
import {
  getLevelRewards,
  getLevelStyle,
  getLevelTier,
} from "@/lib/accountLevel";
import {
  ACCOUNT_MAX_LEVEL,
  addAccountExp,
  getCurrentLevelProgress,
  getDefaultAccountProgress,
  loadAccountProgress,
  setAccountLevel,
  type AccountProgress,
} from "@/lib/accountProgress";

function TierPreview({
  title,
  range,
  level,
}: {
  title: string;
  range: string;
  level: number;
}) {
  const style = getLevelStyle(level);

  return (
    <div
      style={{
        ...glassCard(),
        padding: 14,
        display: "grid",
        gap: 8,
        border: `1px solid ${style.border}`,
        background: style.bg,
        boxShadow: `0 0 22px ${style.glow}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.72,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: style.text,
        }}
      >
        {range}
      </div>

      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          border: `1px solid ${style.border}`,
          background: style.bg,
          color: style.text,
          boxShadow: `0 0 18px ${style.glow}`,
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
        }}
      >
        {level}
      </div>
    </div>
  );
}

export default function AccountLevelPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<AccountProgress>(getDefaultAccountProgress());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setProgress(loadAccountProgress());
    setIsHydrated(true);
  }, []);

  const rewards = useMemo(() => getLevelRewards(), []);
  const safeLevel = progress.level;
  const currentStyle = getLevelStyle(safeLevel);
  const levelProgress = getCurrentLevelProgress(progress);
  const nextReward = rewards.find((reward) => reward.level > safeLevel) ?? null;
  const totalProgressPercent = ((safeLevel - 1) / (ACCOUNT_MAX_LEVEL - 1)) * 100;
  const tier = getLevelTier(safeLevel);

  function refreshProgress() {
    const next = loadAccountProgress();
    setProgress(next);
    setIsHydrated(true);
  }

  return (
    <PageShell
      playerName="Underground Fighter"
      yen={24500}
      tokens={180}
    >
      <section
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
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

          <button
            type="button"
            onClick={() => {
              addAccountExp(150);
              refreshProgress();
            }}
            style={primaryButton()}
          >
            +150 EXP
          </button>

          <button
            type="button"
            onClick={() => {
              setAccountLevel(100);
              refreshProgress();
            }}
            style={secondaryButton()}
          >
            Set 100
          </button>
        </div>

        <div
          style={{
            ...glassCard(),
            padding: 18,
            display: "grid",
            gap: 14,
            border: `1px solid ${currentStyle.border}`,
            background: currentStyle.bg,
            boxShadow: `0 0 26px ${currentStyle.glow}`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.72,
            }}
          >
            Account Level
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  lineHeight: 0.98,
                }}
              >
                Level {safeLevel}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  opacity: 0.8,
                }}
              >
                {currentStyle.name} Tier
              </div>
            </div>

            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 20,
                border: `1px solid ${currentStyle.border}`,
                background: currentStyle.bg,
                color: currentStyle.text,
                boxShadow: `0 0 24px ${currentStyle.glow}`,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 26,
              }}
            >
              {safeLevel}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                fontSize: 12,
                opacity: 0.78,
              }}
            >
              <span>Total progress to 100</span>
              <span>{safeLevel}/{ACCOUNT_MAX_LEVEL}</span>
            </div>

            <div
              style={{
                position: "relative",
                height: 12,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${isHydrated ? totalProgressPercent : 0}%`,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${currentStyle.border}, ${currentStyle.text})`,
                  boxShadow: `0 0 18px ${currentStyle.glow}`,
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                fontSize: 12,
                opacity: 0.78,
              }}
            >
              <span>Current level EXP</span>
              <span>
                {isHydrated
                  ? `${levelProgress.currentExp}/${levelProgress.requiredExp || 0}`
                  : "0/0"}
              </span>
            </div>

            <div
              style={{
                position: "relative",
                height: 12,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${isHydrated ? levelProgress.progressPercent : 0}%`,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${currentStyle.border}, ${currentStyle.text})`,
                  boxShadow: `0 0 18px ${currentStyle.glow}`,
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              opacity: 0.8,
            }}
          >
            Your account level is a long-term prestige track. It unlocks framed level badges,
            pack rewards, currency bonuses, and future profile cosmetics.
          </div>

          {isHydrated && nextReward && (
            <div
              style={{
                borderRadius: 18,
                padding: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity: 0.65,
                }}
              >
                Next Reward
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                Level {nextReward.level} — {nextReward.title}
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.45,
                  opacity: 0.76,
                }}
              >
                {nextReward.description}
              </div>
            </div>
          )}
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
            Rank Frames
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Level Tier Visuals
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <TierPreview title="Bronze" range="1–10" level={5} />
          <TierPreview title="Silver" range="11–25" level={18} />
          <TierPreview title="Gold" range="26–45" level={35} />
          <TierPreview title="Crimson" range="46–65" level={55} />
          <TierPreview title="Legend" range="66–85" level={75} />
          <TierPreview title="Divine" range="86–100" level={95} />
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
            Rewards
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Milestone Track
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          {rewards.map((reward) => {
            const rewardStyle = getLevelStyle(reward.level);
            const unlocked = isHydrated ? safeLevel >= reward.level : false;
            const current = isHydrated ? safeLevel === reward.level : false;

            return (
              <div
                key={reward.level}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  display: "grid",
                  gap: 6,
                  border: `1px solid ${
                    current
                      ? rewardStyle.border
                      : unlocked
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(255,255,255,0.06)"
                  }`,
                  background: current
                    ? rewardStyle.bg
                    : unlocked
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.03)",
                  boxShadow: current ? `0 0 20px ${rewardStyle.glow}` : "none",
                }}
              >
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
                      fontSize: 18,
                      fontWeight: 900,
                    }}
                  >
                    Level {reward.level} — {reward.title}
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.05)",
                      fontSize: 11,
                      fontWeight: 800,
                      color: current
                        ? rewardStyle.text
                        : unlocked
                          ? "#ffffff"
                          : "rgba(255,255,255,0.65)",
                    }}
                  >
                    {current ? "Current" : unlocked ? "Unlocked" : "Locked"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.45,
                    opacity: 0.78,
                  }}
                >
                  {reward.description}
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
          Notes
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            opacity: 0.78,
          }}
        >
          This foundation is now ready for real EXP rewards from battles, missions, pack
          openings, achievements, and seasonal progression.
        </div>

        <div
          style={{
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          Current tier: <strong>{tier}</strong>
        </div>
      </section>
    </PageShell>
  );
}