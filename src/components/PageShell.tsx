import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import { pageBackground } from "@/components/ui";

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <main style={pageBackground()}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          padding: "24px 16px 120px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>{children}</div>
      </div>

      <BottomNav />
    </main>
  );
}