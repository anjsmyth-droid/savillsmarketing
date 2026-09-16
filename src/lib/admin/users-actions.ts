"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMarketingAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import type { RoleName } from "@prisma/client";

export async function updateUserRole(userId: string, role: RoleName) {
  const admin = await requireMarketingAdmin();
  await db.user.update({ where: { id: userId }, data: { role } });
  await recordAudit({ actorId: admin.id, action: "permission.changed", entityType: "User", entityId: userId, metadata: { role } });
  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string, active: boolean) {
  const admin = await requireMarketingAdmin();
  await db.user.update({ where: { id: userId }, data: { active } });
  await recordAudit({ actorId: admin.id, action: "permission.changed", entityType: "User", entityId: userId, metadata: { active } });
  revalidatePath("/admin/users");
}
