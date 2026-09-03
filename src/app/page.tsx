import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { loadInitialDashboard } from "@/lib/server/dashboardRepository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const initial = await loadInitialDashboard();
  return <Dashboard initial={initial} />;
}
