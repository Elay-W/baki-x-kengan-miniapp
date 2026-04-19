"use client";

import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { glassCard, primaryButton, secondaryButton } from "@/components/ui";

type SettingsSection = {
  title: string;
  description: string;
  badge: string;
};

const sections: SettingsSection[] = [
  {
    title: "Audio",
    description: "Click sounds, pack opening effects, music and future volume controls.",
    badge: "Coming soon",
  },
  {
    title: "Visuals",
    description: "Animation intensity, particles, glow effects and future screen shake options.",
    badge: "Coming soon",
  },
  {
    title: "Gameplay",
    description: "Battle flow preferences, auto-advance behavior and future combat options.",
    badge: "Coming soon",
  },
  {
    title: "Account",
    description: "Telegram profile hooks, future sync systems and linked account features.",
    badge: "Coming soon",
  },
  {
    title: "Data",
    description: "Deck reset, local progress tools and future save-management actions.",
    badge: "Coming soon",
  },
  {
    title: "About",
    description: "Project version, build direction and future credits section.",
    badge: "Planned",
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ ...glassCard(), padding: 20 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            System Menu
          </div>

          <div style={{ marginTop: 8, fontSize: 34, fontWeight: 900 }}>
            Settings
          </div>

          <div
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.5,
            }}
          >
            Game preferences, account tools and future system options for Baki X
            Kengan.
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {sections.map((section) => (
            <div
              key={section.title}
              style={{
                ...glassCard(),
                padding: 16,
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
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {section.title}
                </div>

                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.05)",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {section.badge}
                </div>
              </div>

              <div
                style={{
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.5,
                }}
              >
                {section.description}
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...glassCard(), padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Current State</div>
          <div
            style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.5,
            }}
          >
            This menu is now ready as a permanent system hub. Functional toggles
            and actions can be connected here step by step later.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <button onClick={() => router.push("/profile")} style={secondaryButton()}>
              Back to Profile
            </button>
            <button onClick={() => router.push("/")} style={primaryButton()}>
              Back Home
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}