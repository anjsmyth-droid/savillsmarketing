"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMarketingAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

async function logChange(entityType: string, entityId: string, metadata: Record<string, unknown>) {
  const admin = await requireMarketingAdmin();
  await recordAudit({ actorId: admin.id, action: "permission.changed", entityType, entityId, metadata });
  return admin;
}

export async function toggleRequestTypeActive(key: string, active: boolean) {
  await requireMarketingAdmin();
  await db.requestTypeDefinition.update({ where: { key }, data: { active } });
  await logChange("RequestTypeDefinition", key, { active });
  revalidatePath("/admin/settings");
}

export async function addMediaOutlet(name: string, category: string) {
  await requireMarketingAdmin();
  const rec = await db.mediaOutlet.create({ data: { name, category } });
  await logChange("MediaOutlet", rec.id, { action: "created" });
  revalidatePath("/admin/settings");
}

export async function toggleMediaOutletActive(id: string, active: boolean) {
  await requireMarketingAdmin();
  await db.mediaOutlet.update({ where: { id }, data: { active } });
  await logChange("MediaOutlet", id, { active });
  revalidatePath("/admin/settings");
}

export async function addServiceLine(name: string) {
  await requireMarketingAdmin();
  const rec = await db.serviceLine.create({ data: { name } });
  await logChange("ServiceLine", rec.id, { action: "created" });
  revalidatePath("/admin/settings");
}

export async function deleteServiceLine(id: string) {
  await requireMarketingAdmin();
  await db.serviceLine.delete({ where: { id } });
  await logChange("ServiceLine", id, { action: "deleted" });
  revalidatePath("/admin/settings");
}

export async function addAssetType(name: string) {
  await requireMarketingAdmin();
  const rec = await db.assetTypeDefinition.create({ data: { name } });
  await logChange("AssetTypeDefinition", rec.id, { action: "created" });
  revalidatePath("/admin/settings");
}

export async function deleteAssetType(id: string) {
  await requireMarketingAdmin();
  await db.assetTypeDefinition.delete({ where: { id } });
  await logChange("AssetTypeDefinition", id, { action: "deleted" });
  revalidatePath("/admin/settings");
}
