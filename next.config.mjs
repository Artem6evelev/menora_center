import rehypePrism from "@mapbox/rehype-prism";
import nextMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Переносим remotePatterns ВНУТРЬ объекта images
    domains: ["i.pravatar.cc", "images.unsplash.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gwuzekpkfrkmgluzblty.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com", // На будущее для аватарок юзеров
      },
    ],
  },
  pageExtensions: ["ts", "tsx", "mdx"],
  // Turbopack иногда капризничает с MDX, если будут ошибки — можно временно закомментировать
  turbopack: {},
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
});

export default withMDX(nextConfig);
