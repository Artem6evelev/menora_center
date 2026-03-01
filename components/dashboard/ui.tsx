import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur-xl shadow-sm",
        "dark:border-neutral-800/60 dark:bg-neutral-900/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-5 pb-3">
      <div>
        <div className="text-sm font-semibold text-neutral-900 dark:text-white">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-5 pb-5">{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    neutral:
      "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200",
    green:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Divider() {
  return <div className="my-4 h-px bg-neutral-200/70 dark:bg-neutral-800/70" />;
}
