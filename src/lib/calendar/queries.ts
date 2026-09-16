import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export interface CalendarFilters {
  division?: string;
  type?: string;
  ownerId?: string;
  status?: string;
  from: Date;
  to: Date;
}

export async function getCalendarItems(filters: CalendarFilters) {
  const where: Prisma.CalendarItemWhereInput = {
    date: { gte: filters.from, lte: filters.to },
  };
  if (filters.division) where.divisionName = filters.division;
  if (filters.type) where.type = filters.type;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.status) where.status = filters.status;

  return db.calendarItem.findMany({
    where,
    include: { owner: true, request: true, property: true, campaign: true },
    orderBy: { date: "asc" },
  });
}

export async function getCalendarFilterOptions() {
  const [types, statuses, owners] = await Promise.all([
    db.calendarItem.findMany({ distinct: ["type"], select: { type: true } }),
    db.calendarItem.findMany({ distinct: ["status"], select: { status: true } }),
    db.user.findMany({ where: { role: { in: ["MARKETING", "MARKETING_ADMIN"] }, active: true }, select: { id: true, name: true } }),
  ]);
  return {
    types: types.map((t) => t.type),
    statuses: statuses.map((s) => s.status),
    owners,
  };
}
