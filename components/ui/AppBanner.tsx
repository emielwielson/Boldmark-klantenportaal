export type AppBannerVariant = "ok" | "warn" | "denied" | "config" | "neutral";

type AppBannerProps = {
  variant: AppBannerVariant;
  title: string;
  detail?: string;
  className?: string;
};

const variantClass: Record<AppBannerVariant, string> = {
  ok: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
  warn: "border-amber-200/80 bg-amber-50/90 text-amber-950",
  denied: "border-red-200/80 bg-red-50/90 text-red-950",
  config: "border-task-border bg-task-field text-task-ink/90 shadow-sm",
  neutral: "border-task-border bg-task-field text-task-ink/90 shadow-sm",
};

export function AppBanner({
  variant,
  title,
  detail,
  className = "",
}: AppBannerProps) {
  return (
    <div
      role="status"
      className={`rounded-lg border px-4 py-3 text-sm ${variantClass[variant]} ${className}`}
    >
      <p className="font-medium">{title}</p>
      {detail ? (
        <p className="mt-1 leading-relaxed opacity-95">{detail}</p>
      ) : null}
    </div>
  );
}
