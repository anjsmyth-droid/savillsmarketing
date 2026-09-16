"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ai } from "@/lib/ai";
import { recordAudit } from "@/lib/audit";
import { TASK_BY_TYPE, type InsightTask } from "./ai-insight-config";

function formatList(label: string, items?: string[] | null): string {
  if (!items || items.length === 0) return "";
  return `${label}:\n${items.map((i) => `- ${i}`).join("\n")}`;
}

function formatPrAngle(data: Record<string, unknown>): string {
  const structure = (data.potentialStructure as string[]) ?? [];
  const gaps = (data.informationStillRequired as string[]) ?? [];
  return [
    `Suggested angle: ${data.suggestedAngle}`,
    `Potential headline: ${data.potentialHeadline}`,
    `Core argument: ${data.coreArgument}`,
    formatList("Potential structure", structure),
    `Target audience: ${data.targetAudience}`,
    `Potential media: ${data.potentialMedia}`,
    `Supporting evidence supplied: ${data.supportingEvidenceSupplied}`,
    formatList("Information still required", gaps),
  ].filter(Boolean).join("\n\n");
}

function formatOpEdAnalysis(data: Record<string, unknown>): string {
  const structure = (data.potentialStructure as string[]) ?? [];
  const gaps = (data.informationStillRequired as string[]) ?? [];
  return [
    `Suggested angle: ${data.suggestedAngle}`,
    `Potential headline: ${data.potentialHeadline}`,
    `Core argument: ${data.coreArgument}`,
    formatList("Potential structure", structure),
    `Target audience: ${data.targetAudience}`,
    `Potential media: ${data.potentialMedia}`,
    `Supporting evidence supplied: ${data.supportingEvidenceSupplied}`,
    formatList("Information still required", gaps),
  ].filter(Boolean).join("\n\n");
}

function formatSocialCopy(data: Record<string, unknown>): string {
  const variants = (data.variants as string[]) ?? [];
  return [...variants.map((v, i) => `Variant ${i + 1}: ${v}`), data.platformNote].filter(Boolean).join("\n\n");
}

function formatEmailCopy(data: Record<string, unknown>): string {
  const subjectLines = (data.subjectLines as string[]) ?? [];
  return [
    formatList("Subject line options", subjectLines),
    `Headline: ${data.headline}`,
    `Body:\n${data.body}`,
    `Call to action: ${data.cta}`,
  ].filter(Boolean).join("\n\n");
}

const FORMATTERS: Record<InsightTask, (d: Record<string, unknown>) => string> = {
  pr_angle: formatPrAngle,
  op_ed_analysis: formatOpEdAnalysis,
  social_copy: formatSocialCopy,
  email_copy: formatEmailCopy,
};

export async function generateTypeSpecificInsight(requestId: string) {
  const user = await requireUser();
  const request = await db.request.findUniqueOrThrow({ where: { id: requestId } });
  const config = TASK_BY_TYPE[request.requestTypeKey];
  if (!config) throw new Error("No AI insight available for this request type");

  const fields = JSON.parse(request.formData) as Record<string, unknown>;
  const result = await ai.generate<Record<string, unknown>>({ task: config.task, context: fields });
  const body = FORMATTERS[config.task](result.data);

  const contentItem = await db.contentItem.create({
    data: { requestId, kind: config.task, label: config.label },
  });
  const existingCount = await db.contentVersion.count({ where: { contentItemId: contentItem.id } });
  await db.contentVersion.create({
    data: { contentItemId: contentItem.id, versionNumber: existingCount + 1, body, generatedByAI: true, createdById: user.id },
  });

  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "Request", entityId: requestId, metadata: { task: config.task } });
  revalidatePath(`/requests/${requestId}`);
}
