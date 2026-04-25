"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { secondaryButton } from "@/components/ui";
import { getLevelStyle } from "@/lib/accountLevel";
import {
  getDefaultAccountProgress,
  loadAccountProgress,
  type AccountProgress,
} from "@/lib/accountProgress";

type GameHUDProps = {
  playerName?: string;
  yen?: number;
  tokens?: number;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
};

function formatValue(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function CurrencyPill({
  iconSrc,
  value,
  accent,
  label,
}: {
  iconSrc: string;
  value: number;
  accent: string;
  label: string;
}) {
  return (
    <div
      title={label}
      style={{
        minHeight: 36,
        padding: "8px 10px",
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(10,10,14,0.72)",
        border: `1px solid ${accent}`,
        boxShadow: `0 0 18px ${accent}22`,
        backdropFilter: "blur(8px)",
      }}
    >
      <img
        src={iconSrc}
        alt={label}
        style={{
          width: 30,
          height: 30,
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
      />

      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {formatValue(value)}
      </div>
    </div>
  );
}

export default function GameHUD({
  playerName = "Fighter",
  yen = 0,
  tokens = 0,
  onProfileClick,
  onSettingsClick,
}: GameHUDProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<AccountProgress>(getDefaultAccountProgress());

  useEffect(() => {
    setProgress(loadAccountProgress());
  }, []);

  const levelStyle = getLevelStyle(progress.level);

  return (
    <header
      style={{
        position: "sticky",
        top: "max(8px, env(safe-area-inset-top))",
        zIndex: 40,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          borderRadius: 22,
          padding: 12,
          background: "rgba(8,8,12,0.72)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.24)",
          backdropFilter: "blur(14px)",
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/account-level")}
              title="Account Level"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: `1px solid ${levelStyle.border}`,
                background: levelStyle.bg,
                color: levelStyle.text,
                boxShadow: `0 0 20px ${levelStyle.glow}`,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              {progress.level}
            </button>

            <button
              type="button"
              onClick={onProfileClick}
              style={{
                display: "grid",
                gap: 2,
                background: "transparent",
                border: "none",
                color: "#fff",
                padding: 0,
                cursor: onProfileClick ? "pointer" : "default",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  lineHeight: 1.05,
                }}
              >
                {playerName}
              </div>

              <div
                style={{
                  fontSize: 11,
                  opacity: 0.66,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {levelStyle.name} Tier
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={onSettingsClick}
            style={{
              ...secondaryButton(),
              minWidth: 42,
              minHeight: 42,
              padding: 0,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <CurrencyPill
            iconSrc="/currency/yen.png"
            value={yen}
            accent="rgba(217,164,65,0.9)"
            label="Yen"
          />

          <CurrencyPill
            iconSrc="/currency/purgatory-token.png"
            value={tokens}
            accent="rgba(177,30,50,0.95)"
            label="Purgatory Tokens"
          />
        </div>
      </div>
    </header>
  );
}