import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/", "/api/"], // Закрываем личные кабинеты от индексации
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
