"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMarketing } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function updateAssetMetadata(assetId: string, data: { title: string; category: string; confidentiality: string; tags: string[] }) {
  const user = await requireMarketing();

  await db.asset.update({
    where: { id: assetId },
    data: { title: data.title, category: data.category, confidentiality: data.confidentiality },
  });
  await db.assetTag.deleteMany({ where: { assetId } });
  if (data.tags.length) {
    await db.assetTag.createMany({ data: data.tags.map((tag) => ({ assetId, tag })) });
  }
  await recordAudit({ actorId: user.id, action: "asset.metadata_updated", entityType: "Asset", entityId: assetId, metadata: data });
  revalidatePath("/library");
}
