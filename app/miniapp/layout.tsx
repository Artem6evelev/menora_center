import type { Metadata, Viewport } from "next";
import "./miniapp.css";
export const metadata: Metadata = { title: "Menorah Center — Mini App", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f8f7f3" };
export const dynamic = "force-dynamic";
export default function MiniAppLayout({ children }: { children: React.ReactNode }) { return children; }
