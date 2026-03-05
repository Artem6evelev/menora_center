"use client";

import dynamic from "next/dynamic";

function FamilyCanvasSkeleton() {
  return (
    <div className="rounded-[28px] border bg-muted/10 p-6 overflow-hidden">
      <div className="space-y-2">
        <div className="h-6 w-44 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-[520px] max-w-full rounded-md bg-muted animate-pulse" />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-72 rounded bg-muted animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-10 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-16 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-10 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>

        <div className="mt-3 h-[580px] rounded-[28px] border bg-background/55 overflow-hidden relative">
          {/* grid shimmer */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          {/* soft blobs */}
          <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-foreground/[0.03]" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-foreground/[0.03]" />

          {/* center head placeholder */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-24 w-[520px] max-w-[80vw] rounded-[28px] border bg-background/70 backdrop-blur shadow-sm animate-pulse" />
          </div>

          {/* a couple relation placeholders */}
          <div className="absolute left-1/2 top-[120px] -translate-x-1/2">
            <div className="h-14 w-[420px] max-w-[70vw] rounded-2xl border bg-background/70 animate-pulse" />
          </div>
          <div className="absolute left-[140px] top-1/2 -translate-y-1/2">
            <div className="h-14 w-[420px] max-w-[70vw] rounded-2xl border bg-background/70 animate-pulse" />
          </div>
          <div className="absolute right-[140px] top-1/2 -translate-y-1/2">
            <div className="h-14 w-[420px] max-w-[70vw] rounded-2xl border bg-background/70 animate-pulse" />
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-5 w-8 rounded-full bg-muted animate-pulse" />
          </div>

          <div className="mt-3 flex gap-2 overflow-hidden">
            <div className="h-12 w-56 rounded-2xl bg-background/70 border animate-pulse" />
            <div className="h-12 w-56 rounded-2xl bg-background/70 border animate-pulse" />
            <div className="h-12 w-56 rounded-2xl bg-background/70 border animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const FamilyHeadRelationsClient = dynamic(
  () => import("./FamilyHeadRelations").then((m) => m.FamilyHeadRelations),
  {
    ssr: false,
    loading: () => <FamilyCanvasSkeleton />,
  },
);
