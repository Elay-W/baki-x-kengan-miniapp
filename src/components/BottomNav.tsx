"use client";

import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "Collection" },
  { href: "/battle", label: "Battle" },
  { href: "/shop", label: "Shop" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        display: "flex",
        justifyContent: "center",
        padding: "0 16px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          padding: 10,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.82)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
      >
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                padding: "12px 10px",
                borderRadius: 16,
                border: "none",
                background: active ? "#ffffff" : "rgba(255,255,255,0.04)",
                color: active ? "#000000" : "#d4d4d8",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}