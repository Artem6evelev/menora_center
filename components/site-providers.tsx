"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
const WebsiteProviders = dynamic(() => import("./website-providers"));
/** Public TV board and Mini App do not need website authentication/analytics providers. */
export default function SiteProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/zmanim" || pathname === "/miniapp" || pathname.startsWith("/miniapp/")) return children;
  return <WebsiteProviders>{children}</WebsiteProviders>;
}
