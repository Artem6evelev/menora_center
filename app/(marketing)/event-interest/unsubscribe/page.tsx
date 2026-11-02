import InterestUnsubscribe from "@/components/events/interest-unsubscribe";
export const dynamic = "force-dynamic";
export const metadata = { title: "Menorah Center", robots: { index: false, follow: false } };
export default function Page() { return <main className="min-h-screen pt-32 pb-20 px-4 bg-neutral-50"><InterestUnsubscribe /></main>; }
