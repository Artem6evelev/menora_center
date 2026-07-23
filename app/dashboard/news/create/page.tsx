import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import CreateNewsClient from "@/components/dashboard/news/create-news-client";
import { getNewsCategories } from "@/actions/news";

export default async function CreateNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ asAuthor?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (
    !currentUser ||
    (currentUser.role !== "admin" &&
      currentUser.role !== "superadmin" &&
      currentUser.role !== "author")
  ) {
    redirect("/dashboard");
  }

  // Дожидаемся параметров URL
  const resolvedParams = await searchParams;
  const isAuthorMode = resolvedParams?.asAuthor === "true";

  // Если мы пришли из кабинета автора, принудительно ставим роль "author"
  const effectiveRole = isAuthorMode ? "author" : currentUser.role;

  const categories = await getNewsCategories();

  let authorsList: { id: string; name: string }[] = [];

  if (effectiveRole === "admin" || effectiveRole === "superadmin") {
    const fetchedProfiles = await db.query.authorProfiles.findMany({
      with: { user: true },
    });

    authorsList = fetchedProfiles.map((profile) => ({
      id: profile.userId,
      name:
        `${profile.user?.firstName || ""} ${profile.user?.lastName || ""}`.trim() ||
        "Без имени",
    }));
  }

  return (
    <CreateNewsClient
      role={effectiveRole}
      categories={categories}
      authors={authorsList}
    />
  );
}
