import { getNavbarNewsData } from "@/actions/news";
import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";

export async function NavBar() {
  const { latestArticle, categories } = await getNavbarNewsData();

  const navItems = [
    { title: "Услуги", link: "/services" },
    { title: "Мероприятия", link: "/events" },
    {
      title: "Новости",
      link: "/news",
      children: [
        {
          title: "Все новости",
          description: "Главные события нашей общины",
          link: "/news",
          icon: "newspaper", // Передаем строку!
        },
        ...categories.map((cat: any) => ({
          title: cat.name,
          description: cat.description || "Обновления",
          link: `/news?category=${cat.slug}`,
          icon: cat.icon?.toLowerCase() || "users", // Передаем строку!
        })),
      ],
      featured: latestArticle
        ? {
            tag: "АКТУАЛЬНО",
            title: latestArticle.title,
            image:
              latestArticle.imageUrl ||
              "https://images.unsplash.com/photo-1599939571322-792a326cbddc?w=400&q=80",
            link: `/news/${latestArticle.slug}`,
          }
        : null,
    },
    // { title: "О нас", link: "/about" },
  ];

  return (
    <nav className="max-w-7xl fixed top-4 mx-auto inset-x-0 z-50 w-[95%] lg:w-full">
      <div className="hidden lg:block w-full">
        <DesktopNavbar navItems={navItems} />
      </div>
      <div className="flex h-full w-full items-center lg:hidden">
        <MobileNavbar navItems={navItems} />
      </div>
    </nav>
  );
}
