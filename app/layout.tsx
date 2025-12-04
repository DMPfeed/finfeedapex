import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinFeed – Live Financial News",
  description: "Real-time financial news aggregator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-white min-h-screen">{children}</body>
    </html>
  );
}
