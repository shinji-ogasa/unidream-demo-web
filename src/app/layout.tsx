import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniDream — Market Intelligence",
  description: "Transformer世界モデルと強化学習で市場状態を読む、UniDreamの研究・ペーパートレードデモ。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
