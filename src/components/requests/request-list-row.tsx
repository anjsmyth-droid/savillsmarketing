import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { isOverdue } from "@/lib/status";
import type { RequestPriority, RequestStatus } from "@prisma/client";

export interface RequestListItem {
  id: string;
  title: string;
  status: RequestStatus;
  priority: RequestPriority;
  confidential: boolean;
  targetDate: Date | null;
  requestTypeLabel: string;
  requestorName: string;
  marketingOwnerName: string | null;
  marketingOwnerColor: string | null;
}

export function RequestListRow({ item }: { item: RequestListItem }) {
  const overdue = isOverdue(item.targetDate, item.status);
  return (
    <Link href={`/requests/${item.id}`}>
      <Card className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {item.confidential && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate font-medium">{item.title}</span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {item.requestTypeLabel} · Requested by {item.requestorName}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
          <PriorityBadge priority={item.priority} />
          <StatusBadge status={item.status} />
          <span className={`text-xs ${overdue ? "font-medium text-danger" : "text-muted-foreground"}`}>
            {item.targetDate ? formatDate(item.targetDate) : "No date"}
            {overdue ? " · overdue" : ""}
          </span>
          {item.marketingOwnerName ? (
            <Avatar name={item.marketingOwnerName} color={item.marketingOwnerColor ?? undefined} size="sm" />
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
