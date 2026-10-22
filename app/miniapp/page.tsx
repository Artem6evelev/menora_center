import MiniApp from "@/components/miniapp/app";
export default function MiniAppPage() {
  return <MiniApp preview={process.env.NODE_ENV !== "production" && process.env.MENORAH_MINIAPP_PREVIEW === "1"} />;
}
