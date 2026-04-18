"use client";

import Image from "next/image";

export default function SplashScreen({ progress }: { progress: number }) {
  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

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
    </>
  );
}