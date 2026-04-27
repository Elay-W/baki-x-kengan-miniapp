"use client";

import type { ReactNode } from "react";

import BottomNav from "@/components/BottomNav";
import GameHUD from "@/components/GameHUD";

type PageShellProps = {
  children: ReactNode;
  showHUD?: boolean;
  showBottomNav?: boolean;
  playerName?: string;
  yen?: number;
  tokens?: number;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  backgroundImageSrc?: string;
  backgroundOverlay?: string;
};

export default function PageShell({
  children,
  showHUD = true,
  showBottomNav = true,
  playerName = "Baki X Kengan",
  yen = 0,
  tokens = 0,
  onProfileClick,
  onSettingsClick,
  backgroundImageSrc,
  backgroundOverlay,
}: PageShellProps) {
  const hasCustomBackground = Boolean(backgroundImageSrc);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#06070a",
        color: "#fff",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {backgroundImageSrc ? (
        <>
          {/* Заполняющий подложечный слой без черных краев */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundImage: `url("${backgroundImageSrc}")`,
              backgroundPosition: "center center",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              filter: "blur(20px) brightness(0.45)",
              transform: "scale(1.08)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Основной слой — целиком вписывает арт в экран */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundImage: `url("${backgroundImageSrc}")`,
              backgroundPosition: "center center",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Затемнение поверх */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                backgroundOverlay ??
                "linear-gradient(180deg, rgba(4,5,8,0.44) 0%, rgba(4,5,8,0.38) 22%, rgba(4,5,8,0.54) 50%, rgba(4,5,8,0.78) 100%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundImage: 'url("/arena-bg.jpg")',
              backgroundPosition: "center",
              backgroundSize: "cover",
              opacity: 0.18,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(5,6,10,0.78) 0%, rgba(5,6,10,0.68) 24%, rgba(5,6,10,0.82) 100%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        </>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
          margin: "0 auto",
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: "max(10px, env(safe-area-inset-top))",
          paddingBottom: showBottomNav
            ? "calc(110px + env(safe-area-inset-bottom))"
            : "max(16px, env(safe-area-inset-bottom))",
          display: "grid",
          gap: 12,
        }}
      >
        {showHUD && (
          <GameHUD
            playerName={playerName}
            yen={yen}
            tokens={tokens}
            onProfileClick={onProfileClick}
            onSettingsClick={onSettingsClick}
          />
        )}

        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {children}
        </div>
      </div>

      {showBottomNav && <BottomNav />}
    </div>
  );
}