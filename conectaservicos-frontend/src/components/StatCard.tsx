import type { ReactNode } from "react";
import { Card, Skeleton } from "@/components/ui";

export function StatCard({
  label,
  value,
  icon,
  hint,
  loading = false,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold text-ink">{value}</p>
          )}
          {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
        {icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">{icon}</span>
        ) : null}
      </div>
    </Card>
  );
}
