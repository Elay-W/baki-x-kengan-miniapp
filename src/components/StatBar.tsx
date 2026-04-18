"use client";

import { statColor } from "@/components/ui";

export default function StatBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#d4d4d8",
        }}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div
        style={{
          width: "100%",
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: "#27272a",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            borderRadius: 999,
            background: statColor(value),
          }}
        />
      </div>
    </div>
  );
}