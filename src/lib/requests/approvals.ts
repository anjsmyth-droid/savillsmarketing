"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMarketing, requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function requestApproval(requestId: string, itemLabel: string, approverId: string) {
  const user = await requireMarketing();
  const request = await db.request.findUniqueOrThrow({ where: { id: requestId } });

  const approval = await db.approval.create({
    data: { requestId, itemLabel, requestedById: user.id, approverId },
  });
  await db.request.update({ where: { id: requestId }, data: { status: "AWAITING_APPROVAL" } });
  await recordAudit({ actorId: user.id, action: "approval.requested", entityType: "Approval", entityId: approval.id, metadata: { requestId, itemLabel } });
  await notify({ userId: approverId, type: "approval_requested", title: "Approval needed", body: `${itemLabel} on "${request.title}" is ready for your review.`, link: `/requests/${requestId}` });

  revalidatePath(`/requests/${requestId}`);
}

export async function decideApproval(approvalId: string, decision: "APPROVED" | "CHANGES_REQUESTED", note?: string) {
  const user = await requireUser();
  const approval = await db.approval.findUniqueOrThrow({ where: { id: approvalId }, include: { request: true } });
  if (approval.approverId !== user.id) throw new Error("Only the assigned approver can decide this approval");

  await db.approval.update({ where: { id: approvalId }, data: { status: decision, note, decidedAt: new Date() } });
  await recordAudit({ actorId: user.id, action: "approval.decided", entityType: "Approval", entityId: approvalId, metadata: { decision } });

  if (decision === "CHANGES_REQUESTED" && approval.request.marketingOwnerId) {
    await notify({
      userId: approval.request.marketingOwnerId,
      type: "changes_requested",
      title: "Changes requested",
      body: `${user.name} requested changes on "${approval.request.title}".`,
      link: `/requests/${approval.requestId}`,
    });
  }

  revalidatePath(`/requests/${approval.requestId}`);
}
