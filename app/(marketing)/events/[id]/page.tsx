import { cookies } from "next/headers";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getEventById } from "@/actions/event";
import SingleEventClient from "@/components/events/single-event-client";
import AccessScreen from "@/components/community/access-screen";
import { currentCommunityUser } from "@/lib/community/server";
import { communityAccess } from "@/lib/community/policy";
import { canRegisterEvent } from "@/lib/events/eligibility";
interface Props { params: Promise<{ id: string }> }
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventById((await params).id);
  return event ? { title: event.title, description: event.description?.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: { title: event.title, images: event.imageUrl ? [event.imageUrl] : [] } } :
    { title: "Menorah Center", robots: { index: false, follow: false } };
}
export default async function SingleEventPage({ params }: Props) {
  const { id } = await params;
  const [eventData, profile] = await Promise.all([getEventById(id), currentCommunityUser()]);
  const access = communityAccess(profile);
  const preference = (await cookies()).get("menorah_event_language")?.value;
  const language = preference === "he" || preference === "en" ? preference : "ru";
  if (!eventData) notFound();
  return <SingleEventClient key={profile?.id ?? "public"} eventData={eventData} initialLanguage={language} userId={profile?.id ?? null}
    canRegisterChildren={access.canRegisterChildren} canRegisterSelf={canRegisterEvent(eventData, profile)}
    canClarifyChildren={profile?.affiliation === "giyur" && profile?.gender === "female" && !access.canManageChildren} />;
}
