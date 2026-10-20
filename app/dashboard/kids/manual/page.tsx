import { requireDashboardFilter } from "@/lib/community/server";
import { requireStaff } from "@/lib/community/server";
import { getEvents } from "@/actions/event";
import ManualChildForm from "@/components/community/manual-child-form";
import { redirect } from "next/navigation";
export default async function Page() {
  await requireDashboardFilter();
  try { await requireStaff(); } catch { redirect("/dashboard"); }
  const list = await getEvents();
  return <ManualChildForm events={list.filter(item => item.event.status === "planned" && !item.event.isRegistrationClosed).map(item => ({ id: item.event.id, title: item.event.title }))} />;
}
