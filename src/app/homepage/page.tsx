import type { Metadata } from "next";

import MarketingPage from "@/features/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "UniDream — 市場の隠れた構造を読む",
  description: "Transformer世界モデルと強化学習で市場状態を学習し、検証可能な意思決定へ変換する研究開発プロダクト。",
};

export default function HomepageRoute() {
  return <MarketingPage />;
}
