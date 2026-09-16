"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMarketing } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import type { RequestPriority, RequestStatus } from "@prisma/client";

const STATUS_NOTIFICATION: Partial<Record<RequestStatus, { title: string; body: (t: string) => string }>> = {
  BRIEF_REVIEW: { title: "Request under review", body: (t) => `Marketing is reviewing your brief for "${t}".` },
  IN_PROGRESS: { title: "Work has started", body: (t) => `Marketing has started work on "${t}".` },
  DRAFT_READY: { title: "Draft ready for your review", body: (t) => `A draft is ready for your review on "${t}".` },
  AWAITING_REQUESTOR: { title: "Action needed from you", body: (t) => `Marketing needs something from you on "${t}".` },
  AWAITING_APPROVAL: { title: "Approval requested", body: (t) => `Your approval is requested on "${t}".` },
  SCHEDULED: { title: "Request scheduled", body: (t) => `"${t}" has been scheduled.` },
  COMPLETE: { title: "Request completed", body: (t) => `"${t}" is now complete.` },
};

export async function changeStatus(requestId: string, status: RequestStatus, note?: string) {
  const user = await requireMarketing();
  const request = await db.request.findUniqueOrThrow({ where: { id: requestId } });

  await db.request.update({
    where: { id: requestId },
    data: { status, completedAt: status === "COMPLETE" ? new Date() : request.completedAt },
  });
  await db.requestStatusHistory.create({
    data: { requestId, fromStatus: request.status, toStatus: status, changedById: user.id, note },
  });
  await recordAudit({ actorId: user.id, action: status === "COMPLETE" ? "request.completed" : "request.status_changed", entityType: "Request", entityId: requestId, metadata: { from: request.status, to: status } });

  const notif = STATUS_NOTIFICATION[status];
  if (notif) {
    await notify({ userId: request.requestorId, type: "status_changed", title: notif.title, body: notif.body(request.title), link: `/requests/${requestId}` });
  }

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/home");
  revalidatePath("/admin");
}

export async function assignOwner(requestId: string, ownerId: string, kind: "marketing" | "creative") {
  const user = await requireMarketing();
  const request = await db.request.findUniqueOrThrow({ where: { id: requestId } });
  const owner = await db.user.findUniqueOrThrow({ where: { id: ownerId } });

  await db.request.update({
    where: { id: requestId },
    data: kind === "marketing" ? { marketingOwnerId: ownerId } : { creativeOwnerId: ownerId },
  });
  await db.requestParticipant.upsert({
    where: { requestId_userId: { requestId, userId: ownerId } },
    create: { requestId, userId: ownerId, role: "COLLABORATOR" },
    update: {},
  });
  await recordAudit({ actorId: user.id, action: "request.assigned", entityType: "Request", entityId: requestId, metadata: { kind, ownerId } });
  await notify({ userId: ownerId, type: "assigned", title: "You've been assigned a request", body: `You are now the ${kind} owner for "${request.title}".`, link: `/requests/${requestId}` });

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/admin");
  void owner;
}

export async function changePriority(requestId: string, priority: RequestPriority) {
  const user = await requireMarketing();
  await db.request.update({ where: { id: requestId }, data: { priority } });
  await recordAudit({ actorId: user.id, action: "request.priority_changed", entityType: "Request", entityId: requestId, metadata: { priority } });
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/admin");
}
