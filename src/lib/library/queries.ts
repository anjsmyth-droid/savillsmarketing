import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { isMarketing } from "@/lib/auth";

export { LIBRARY_CATEGORIES } from "./constants";

export interface LibraryFilters {
  q?: string;
  category?: string;
  year?: number;
  serviceLine?: string;
}

export async function searchAssets(user: SessionUser, filters: LibraryFilters) {
  const where: Prisma.AssetWhereInput = { AND: [] };
  const and = where.AND as Prisma.AssetWhereInput[];

  if (!isMarketing(user)) {
    and.push({
      OR: [
        { confidentiality: "STANDARD" },
        { request: { OR: [{ requestorId: user.id }, { participants: { some: { userId: user.id } } }] } },
      ],
    });
  }

  if (filters.category) and.push({ category: filters.category });
  if (filters.year) and.push({ year: filters.year });
  if (filters.serviceLine) and.push({ serviceLine: filters.serviceLine });
  if (filters.q) {
    const q = filters.q;
    and.push({
      OR: [
        { title: { contains: q } },
        { clientName: { contains: q } },
        { property: { name: { contains: q } } },
        { property: { address: { contains: q } } },
        { tags: { some: { tag: { contains: q } } } },
        { file: { filename: { contains: q } } },
      ],
    });
  }

  return db.asset.findMany({
    where,
    include: { file: true, property: true, campaign: true, marketingOwner: true, tags: true },
    orderBy: { createdAt: "desc" },
    take: 120,
  });
}
