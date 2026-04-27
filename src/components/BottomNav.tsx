"use client";

import { usePathname, useRouter } from "next/navigation";

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  {
    key: "home",
    label: "Home",
    href: "/",
    icon: "/nav/home.png",
  },
  {
    key: "collection",
    label: "Collection",
    href: "/collection",
    icon: "/nav/collection.png",
  },
  {
    key: "battle",
    label: "Battle",
    href: "/battle",
    icon: "/nav/battle.png",
  },
  {
    key: "shop",
    label: "Shop",
    href: "/shop",
    icon: "/nav/shop.png",
  },
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

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
        zIndex: 60,
        padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
        background:
          "linear-gradient(to top, rgba(4,4,10,0.96), rgba(4,4,10,0.82), rgba(4,4,10,0.55), transparent)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            padding: 8,
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(10,10,16,0.92)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.03) inset, 0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => router.push(item.href)}
                style={{
                  appearance: "none",
                  border: active
                    ? "1px solid rgba(255,255,255,0.16)"
                    : "1px solid rgba(255,255,255,0.04)",
                  outline: "none",
                  cursor: "pointer",
                  borderRadius: 18,
                  minHeight: 74,
                  padding: "8px 6px 7px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  background: active
                    ? "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
                  boxShadow: active
                    ? "0 0 18px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)"
                    : "inset 0 1px 0 rgba(255,255,255,0.03)",
                  transition: "all 0.18s ease",
                }}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  style={{
                    width: active ? 45 : 41,
                    height: active ? 45 : 41,
                    objectFit: "contain",
                    display: "block",
                    filter: active
                      ? "drop-shadow(0 0 8px rgba(255,160,60,0.28))"
                      : "drop-shadow(0 0 4px rgba(0,0,0,0.25))",
                    transition: "all 0.18s ease",
                  }}
                />

                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    color: active ? "#ffffff" : "rgba(255,255,255,0.72)",
                    transition: "all 0.18s ease",
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}