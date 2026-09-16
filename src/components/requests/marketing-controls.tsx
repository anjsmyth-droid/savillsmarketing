"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/input";
import { assignOwner, changePriority, changeStatus } from "@/lib/requests/admin-actions";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/status";
import type { RequestPriority, RequestStatus } from "@prisma/client";

interface Person {
  id: string;
  name: string;
}

export function MarketingControls({
  requestId,
  status,
  priority,
  marketingOwnerId,
  creativeOwnerId,
  marketingTeam,
  creativeTeam,
}: {
  requestId: string;
  status: RequestStatus;
  priority: RequestPriority;
  marketingOwnerId: string | null;
  creativeOwnerId: string | null;
  marketingTeam: Person[];
  creativeTeam: Person[];
}) {
  const [pending, startTransition] = useTransition();

  const selectClass =
    "h-9 w-full rounded-md border border-border-strong bg-surface px-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50";

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 sm:col-span-1">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <select
          className={selectClass}
          defaultValue={status}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              await changeStatus(requestId, e.target.value as RequestStatus);
              toast.success("Status updated");
            })
          }
        >
          {STATUS_ORDER.filter((s) => s !== "DRAFT").map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label className="text-xs text-muted-foreground">Priority</Label>
        <select
          className={selectClass}
          defaultValue={priority}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              await changePriority(requestId, e.target.value as RequestPriority);
              toast.success("Priority updated");
            })
          }
        >
          <option value="NORMAL">Normal</option>
          <option value="IMPORTANT">Important</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label className="text-xs text-muted-foreground">Marketing owner</Label>
        <select
          className={selectClass}
          defaultValue={marketingOwnerId ?? ""}
          disabled={pending}
          onChange={(e) =>
            e.target.value &&
            startTransition(async () => {
              await assignOwner(requestId, e.target.value, "marketing");
              toast.success("Marketing owner assigned");
            })
          }
        >
          <option value="">Unassigned</option>
          {marketingTeam.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label className="text-xs text-muted-foreground">Creative Services owner</Label>
        <select
          className={selectClass}
          defaultValue={creativeOwnerId ?? ""}
          disabled={pending}
          onChange={(e) =>
            e.target.value &&
            startTransition(async () => {
              await assignOwner(requestId, e.target.value, "creative");
              toast.success("Creative Services owner assigned");
            })
          }
        >
          <option value="">Unassigned</option>
          {creativeTeam.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
