import rehypePrism from "@mapbox/rehype-prism";
import nextMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ["i.pravatar.cc", "images.unsplash.com"] },
  pageExtensions: ["ts", "tsx", "mdx"],
  remotePatterns: [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
  ],
};

// ВАЖНО: Указываем путь к i18n.ts
const withNextIntl = createNextIntlPlugin("./i18n.ts");

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
});

export default withNextIntl(withMDX(nextConfig));
