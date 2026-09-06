import type { Metadata } from "next";

import MarketingPage from "@/features/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "UniDream — 長期投資をAIで再設計",
  description: "Buy & Holdを基準に、市場状態を理解するAIの判断レイヤーを重ねるUniDreamの研究・デモ。",
};

export default function HomepageRoute() {
  return <MarketingPage />;
}
