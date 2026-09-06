import { BtcDashboard } from "@/features/btc-dashboard/BtcDashboard";
import { loadBtcDashboard } from "@/lib/server/btcDashboardRepository";
import { loadBtcReleaseEvidence } from "@/lib/server/btcReleaseEvidence";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initial = await loadBtcDashboard();
  return <BtcDashboard initial={initial} evidence={loadBtcReleaseEvidence()} />;
}
