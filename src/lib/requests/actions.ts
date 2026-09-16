"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getWorkflowDefinition } from "@/lib/workflows/definitions";
import { computeRequestTitle } from "@/lib/workflows/title";
import { storage } from "@/lib/storage";
import { ai } from "@/lib/ai";
import { recordAudit } from "@/lib/audit";
import { notifyMany } from "@/lib/notifications";
import { autoCaptureAsset } from "@/lib/library/asset-capture";

async function assertParticipant(requestId: string, userId: string) {
  const request = await db.request.findUniqueOrThrow({ where: { id: requestId } });
  if (request.requestorId === userId) return request;
  const isParticipant = await db.requestParticipant.findUnique({ where: { requestId_userId: { requestId, userId } } });
  if (!isParticipant) throw new Error("Forbidden");
  return request;
}

export async function startDraft(formData: FormData) {
  const user = await requireUser();
  const typeKey = String(formData.get("typeKey") ?? "");
  const isStudioType = typeKey === "brochure" || typeKey === "pitch_tender";
  if (!isStudioType && !getWorkflowDefinition(typeKey)) {
    throw new Error(`Unknown request type: ${typeKey}`);
  }

  const request = await db.request.create({
    data: {
      title: computeRequestTitle(typeKey, {}),
      requestTypeKey: typeKey,
      status: "DRAFT",
      requestorId: user.id,
      formData: "{}",
      participants: { create: [{ userId: user.id, role: "REQUESTOR" }] },
      statusHistory: { create: [{ toStatus: "DRAFT", changedById: user.id }] },
    },
  });
  await recordAudit({ actorId: user.id, action: "request.created", entityType: "Request", entityId: request.id, metadata: { typeKey } });

  if (typeKey === "brochure") redirect(`/brochure-studio/${request.id}`);
  if (typeKey === "pitch_tender") redirect(`/pitch-studio/${request.id}`);
  redirect(`/requests/${request.id}/edit`);
}

export async function saveDraft(requestId: string, values: Record<string, unknown>) {
  const user = await requireUser();
  const request = await assertParticipant(requestId, user.id);
  const title = computeRequestTitle(request.requestTypeKey, values);
  await db.request.update({ where: { id: requestId }, data: { formData: JSON.stringify(values), title } });
  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/edit`);
  return { ok: true as const };
}

export async function uploadRequestFile(formData: FormData) {
  const user = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");
  const assetTypeTag = String(formData.get("assetTypeTag") ?? "other");
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  await assertParticipant(requestId, user.id);

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storageKey } = await storage.put({ buffer, filename: file.name, mimeType: file.type || "application/octet-stream" });

  const saved = await db.file.create({
    data: {
      requestId,
      uploadedById: user.id,
      filename: file.name,
      storageKey,
      mimeType: file.type || "application/octet-stream",
      size: buffer.byteLength,
      assetTypeTag,
    },
  });

  await recordAudit({ actorId: user.id, action: "file.uploaded", entityType: "File", entityId: saved.id, metadata: { requestId, filename: file.name } });
  await autoCaptureAsset(saved.id).catch(() => undefined);
  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}/edit`);
  revalidatePath("/library");
  return { id: saved.id, filename: saved.filename, assetTypeTag: saved.assetTypeTag };
}

export async function deleteRequestFile(fileId: string) {
  const user = await requireUser();
  const file = await db.file.findUniqueOrThrow({ where: { id: fileId } });
  if (file.requestId) await assertParticipant(file.requestId, user.id);
  await storage.remove(file.storageKey).catch(() => undefined);
  await db.file.delete({ where: { id: fileId } });
  await recordAudit({ actorId: user.id, action: "file.deleted", entityType: "File", entityId: fileId, metadata: { requestId: file.requestId } });
  if (file.requestId) {
    revalidatePath(`/requests/${file.requestId}`);
    revalidatePath(`/requests/${file.requestId}/edit`);
  }
}

export async function submitRequest(requestId: string) {
  const user = await requireUser();
  const request = await assertParticipant(requestId, user.id);
  const def = getWorkflowDefinition(request.requestTypeKey);
  const values = JSON.parse(request.formData) as Record<string, unknown>;

  if (def) {
    const missing = def.requiredFields.filter((f) => {
      const v = values[f.key];
      return v === undefined || v === null || v === "";
    });
    if (missing.length > 0) {
      return { error: `Please complete: ${missing.map((m) => m.label).join(", ")}` };
    }
  }

  const title = computeRequestTitle(request.requestTypeKey, values);
  const requestType = await db.requestTypeDefinition.findUnique({ where: { key: request.requestTypeKey } });

  const briefSummaryResult = await ai.generate<{ summary: string }>({
    task: "brief_summary",
    context: { title, requestTypeLabel: requestType?.label ?? request.requestTypeKey, requestorName: user.name, fields: values },
  });

  await db.request.update({
    where: { id: requestId },
    data: {
      title,
      status: "SUBMITTED",
      submittedAt: new Date(),
      briefSummary: briefSummaryResult.data.summary,
    },
  });
  await db.requestStatusHistory.create({
    data: { requestId, fromStatus: "DRAFT", toStatus: "SUBMITTED", changedById: user.id },
  });
  await recordAudit({ actorId: user.id, action: "request.submitted", entityType: "Request", entityId: requestId, metadata: { title } });

  const marketingUsers = await db.user.findMany({ where: { role: { in: ["MARKETING", "MARKETING_ADMIN"] }, active: true } });
  await notifyMany(marketingUsers.map((m) => m.id), {
    type: "request_submitted",
    title: "New request submitted",
    body: `${user.name} submitted "${title}" — needs a Marketing owner.`,
    link: `/requests/${requestId}`,
  });

  revalidatePath("/requests");
  revalidatePath("/home");
  redirect(`/requests/${requestId}`);
}

export async function addComment(requestId: string, body: string, visibility: "INTERNAL" | "REQUESTOR") {
  const user = await requireUser();
  await assertParticipant(requestId, user.id);
  if (!body.trim()) return;

  await db.comment.create({ data: { requestId, authorId: user.id, body: body.trim(), visibility } });
  await recordAudit({ actorId: user.id, action: "comment.added", entityType: "Request", entityId: requestId });

  if (visibility === "REQUESTOR") {
    const request = await db.request.findUniqueOrThrow({ where: { id: requestId } });
    const notifyTargets = new Set<string>();
    if (request.requestorId !== user.id) notifyTargets.add(request.requestorId);
    const participants = await db.requestParticipant.findMany({ where: { requestId } });
    for (const p of participants) if (p.userId !== user.id) notifyTargets.add(p.userId);
    await notifyMany(Array.from(notifyTargets), {
      type: "comment_added",
      title: "New update on your request",
      body: `${user.name}: ${body.trim().slice(0, 120)}`,
      link: `/requests/${requestId}`,
    });
  }

  revalidatePath(`/requests/${requestId}`);
}
