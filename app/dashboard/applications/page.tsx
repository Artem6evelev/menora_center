import { requireDashboardFilter, requireStaff } from "@/lib/community/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { readApplicationEventStats } from "@/lib/community/event-payment-crm";
import ApplicationsClient from "@/components/dashboard/applications/application-client";
export default async function ApplicationsPage() {
  await requireDashboardFilter();
  try { await requireStaff(); } catch { redirect("/dashboard"); }
  const rows = await readApplicationEventStats(db);
  return <ApplicationsClient events={rows.map(({ event: { paymentUrl: _paymentUrl, ...event }, ...stats }) => ({ ...event, ...stats }))} />;
}
