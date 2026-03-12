import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUserFromClerk } from "@/lib/auth/syncUser";

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const synced = await syncUserFromClerk();
  if (!synced) redirect("/sign-in");

  if (!synced.dbUser.isAdmin) redirect("/");

  return synced.dbUser;
}
