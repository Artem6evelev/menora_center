"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
const WebsiteProviders = dynamic(() => import("./website-providers"));
/** Mini App does not download or mount the website authentication/analytics providers. */
export default function SiteProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/miniapp" || pathname.startsWith("/miniapp/")) return children;
  return <WebsiteProviders>{children}</WebsiteProviders>;
}
