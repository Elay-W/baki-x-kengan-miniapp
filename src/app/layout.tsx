import type { Metadata } from "next";
import "./globals.css";
import GlobalClickSound from "@/components/GlobalClickSound";

export const metadata: Metadata = {
  title: "Baki X Kengan",
  description: "Collect fighter cards, build your deck, and dominate the arena.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GlobalClickSound />
        {children}
      </body>
    </html>
  );
}