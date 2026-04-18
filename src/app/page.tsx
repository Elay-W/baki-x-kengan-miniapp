"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TgUser = {
  id: number;
  first_name?: string;
  username?: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe?: {
          user?: TgUser;
        };
      };
    };
  }
}

export default function Home() {
  const [name, setName] = useState("fighter");
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
      setIsTelegram(true);

      const user = tg.initDataUnsafe?.user;
      if (user?.first_name) setName(user.first_name);
      else if (user?.username) setName(user.username);
    }
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "32px",
          alignItems: "center",
        }}
      >
        <div>
          <img
            src="/welcome-banner.png"
            alt="Baki X Kengan"
            style={{
              width: "100%",
              borderRadius: "24px",
              display: "block",
              boxShadow: "0 0 40px rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "64px", marginBottom: "16px", lineHeight: 1 }}>
            Baki X Kengan
          </h1>

          <p style={{ fontSize: "24px", opacity: 0.85, marginBottom: "14px" }}>
            Collect fighter cards, build your deck, and dominate the arena.
          </p>

          <div
            style={{
              marginBottom: "28px",
              opacity: 0.75,
              fontSize: "16px",
            }}
          >
            {isTelegram ? `Connected as ${name}` : "Opened in browser mode"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "14px",
              maxWidth: "420px",
              margin: "0 auto",
            }}
          >
            <Link href="/collection" style={btnStyle}>Collection</Link>
            <Link href="/deck" style={btnStyle}>Deck</Link>
            <Link href="/battle" style={btnStyle}>Battle</Link>
            <Link href="/shop" style={btnStyle}>Shop</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "16px 18px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: "17px",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};