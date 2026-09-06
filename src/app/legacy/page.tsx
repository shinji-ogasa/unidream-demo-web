import Link from "next/link";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { loadInitialDashboard } from "@/lib/server/dashboardRepository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LegacyPage() {
  let initial;
  try {
    initial = await loadInitialDashboard();
  } catch {
    initial = null;
  }
  return (
    <>
      <aside className="btc-legacy-banner">
        旧 Plan011 モデルの履歴 · 新しい公開実行とは別の結果です。
        <Link href="/">現在のBTCモデルへ →</Link>
      </aside>
      {initial ? (
        <Dashboard initial={initial} />
      ) : (
        <main className="dashboard-shell">
          <div className="dashboard-container">
            <p className="btc-notice">
              旧モデルの記録を取得できません。接続が戻ると履歴を確認できます。
            </p>
            <Link href="/">現在のBTCモデルへ戻る →</Link>
          </div>
        </main>
      )}
    </>
  );
}
