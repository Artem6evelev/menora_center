import PrivateSession from "@/components/community/private-session";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getEventById } from "@/actions/event";
import SingleEventClient from "@/components/events/single-event-client";
import AccessScreen from "@/components/community/access-screen";
import { currentCommunityUser } from "@/lib/community/server";
import { communityAccess } from "@/lib/community/policy";
interface Props { params: Promise<{ id: string }> }
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  // Public sharing reveals no event data, independently of the caller's session/cache.
  return { title: "Событие общины | Menorah Center", description: "Войдите в аккаунт или зарегистрируйтесь в общине, чтобы продолжить.", robots: { index: false, follow: false }, openGraph: { title: "Событие общины | Menorah Center", description: "Вход и регистрационная анкета общины", images: [] } };
}
export default async function SingleEventPage({ params }: Props) {
  const { id } = await params; const { userId } = await auth();
  const profile = await currentCommunityUser(); const access = communityAccess(profile);
  if (!access.canViewEvents) return <AccessScreen reason={userId ? access.reason : "guest"} returnTo={`/events/${id}`} />;
  const eventData = await getEventById(id);
  if (!eventData) notFound();
  return <PrivateSession key={profile!.id} expectedUserId={profile!.id}><SingleEventClient eventData={eventData} userId={userId} canRegisterChildren={access.canRegisterChildren} canRegisterSelf={access.canRegisterSelf} canClarifyChildren={profile?.affiliation === "giyur" && profile?.gender === "female" && !access.canManageChildren} /></PrivateSession>;
}
