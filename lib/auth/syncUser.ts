import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const BOOTSTRAP_ADMIN_EMAIL = (
  process.env.BOOTSTRAP_ADMIN_EMAIL || "artem6evelev92@gmail.com"
).toLowerCase();

export async function syncUserFromClerk() {
  const cu = await currentUser();
  if (!cu) return null;

  const clerkUserId = cu.id;

  const primaryEmail =
    cu.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)
      ?.emailAddress ||
    cu.emailAddresses?.[0]?.emailAddress ||
    "";

  const email = primaryEmail.trim().toLowerCase();
  if (!email) throw new Error("No email on Clerk user");

  // Upsert user row
  const dbUser = await prisma.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email,
      isAdmin: email === BOOTSTRAP_ADMIN_EMAIL,
    },
    update: {
      email,
      // если это bootstrap email — гарантируем admin
      ...(email === BOOTSTRAP_ADMIN_EMAIL ? { isAdmin: true } : {}),
    },
  });

  return { clerkUserId, email, dbUser };
}
