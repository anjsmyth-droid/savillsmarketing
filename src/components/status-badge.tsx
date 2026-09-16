import type { RequestPriority, RequestStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_BADGE_VARIANT, PRIORITY_LABEL, STATUS_BADGE_VARIANT, STATUS_LABEL } from "@/lib/status";

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  if (priority === "NORMAL") return null;
  return <Badge variant={PRIORITY_BADGE_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
