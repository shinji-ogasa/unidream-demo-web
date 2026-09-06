import type { Metadata } from "next";

import MarketingPage from "@/features/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "UniDream — 長期投資をAIで再設計",
  description: "Buy & Holdを基準に、AIオーバーレイとB&H-relative evidenceを検証する研究開発プロダクト。",
};

export default function HomepageRoute() {
  return <MarketingPage />;
}
