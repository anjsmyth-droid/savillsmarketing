"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { decideApproval, requestApproval } from "@/lib/requests/approvals";

export interface ApprovalItem {
  id: string;
  itemLabel: string;
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  note: string | null;
  createdAt: string;
  approverId: string;
  approverName: string;
  requestedByName: string;
}

export function ApprovalsPanel({
  requestId,
  approvals,
  canRequest,
  currentUserId,
  potentialApprovers,
}: {
  requestId: string;
  approvals: ApprovalItem[];
  canRequest: boolean;
  currentUserId: string;
  potentialApprovers: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [itemLabel, setItemLabel] = useState("");
  const [approverId, setApproverId] = useState(potentialApprovers[0]?.id ?? "");

  return (
    <div className="space-y-3">
      {canRequest && (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-end gap-3 py-4">
            <div className="min-w-48 flex-1">
              <Label className="text-xs text-muted-foreground">What needs approval?</Label>
              <Input value={itemLabel} onChange={(e) => setItemLabel(e.target.value)} placeholder="e.g. Press release draft" />
            </div>
            <div className="min-w-40">
              <Label className="text-xs text-muted-foreground">Approver</Label>
              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="h-10 w-full rounded-md border border-border-strong bg-surface px-2.5 text-sm"
              >
                {potentialApprovers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              disabled={pending || !itemLabel.trim() || !approverId}
              onClick={() =>
                startTransition(async () => {
                  await requestApproval(requestId, itemLabel.trim(), approverId);
                  setItemLabel("");
                  toast.success("Approval requested");
                })
              }
            >
              Request approval
            </Button>
          </CardContent>
        </Card>
      )}

      {approvals.length === 0 ? (
        <div className="rounded-lg border border-border py-12 text-center text-sm text-muted-foreground">
          No approvals requested yet.
        </div>
      ) : (
        approvals.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">{a.itemLabel}</div>
                <div className="text-xs text-muted-foreground">
                  Requested from {a.approverName} by {a.requestedByName} · {formatDateTime(a.createdAt)}
                </div>
                {a.note && <div className="mt-1 text-sm text-muted-foreground">&quot;{a.note}&quot;</div>}
              </div>
              <div className="flex items-center gap-2">
                {a.status === "PENDING" && a.approverId === currentUserId ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => startTransition(async () => { await decideApproval(a.id, "CHANGES_REQUESTED"); toast.success("Changes requested"); })}
                    >
                      <X className="h-3.5 w-3.5" /> Request changes
                    </Button>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => startTransition(async () => { await decideApproval(a.id, "APPROVED"); toast.success("Approved"); })}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  </>
                ) : (
                  <Badge variant={a.status === "APPROVED" ? "success" : a.status === "CHANGES_REQUESTED" ? "danger" : "warning"}>
                    {a.status === "PENDING" ? "Pending" : a.status === "APPROVED" ? "Approved" : "Changes requested"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
