import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniDream Demo",
  description: "UniDream live paper-trading demo (research only — not financial advice).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
