import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniDream — B&HをAIで再設計する",
  description: "Buy & Holdを基準に、AIオーバーレイとB&H-relative evidenceを検証するUniDreamの研究・ペーパートレードデモ。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
