"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMarketingAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function createKnowledgeDocument(input: { title: string; category: string; body: string; tags: string }) {
  const admin = await requireMarketingAdmin();
  const doc = await db.knowledgeDocument.create({ data: input });
  await recordAudit({ actorId: admin.id, action: "permission.changed", entityType: "KnowledgeDocument", entityId: doc.id, metadata: { action: "created" } });
  revalidatePath("/admin/knowledge");
}

export async function deleteKnowledgeDocument(id: string) {
  const admin = await requireMarketingAdmin();
  await db.knowledgeDocument.delete({ where: { id } });
  await recordAudit({ actorId: admin.id, action: "permission.changed", entityType: "KnowledgeDocument", entityId: id, metadata: { action: "deleted" } });
  revalidatePath("/admin/knowledge");
}
