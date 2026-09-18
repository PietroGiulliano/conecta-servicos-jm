import { Badge } from "@/components/ui";
import { formatStatus } from "@/utils/status";

export function StatusBadge({ status }: { status: string }) {
  const { label, tone } = formatStatus(status);
  return <Badge tone={tone}>{label}</Badge>;
}
