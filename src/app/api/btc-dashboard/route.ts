import { loadBtcDashboard } from "@/lib/server/btcDashboardRepository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json(await loadBtcDashboard(), {
    headers: { "Cache-Control": "no-store" },
  });
}
