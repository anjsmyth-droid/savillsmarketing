import type { Prisma } from "@prisma/client";
import type { RequestListItem } from "@/components/requests/request-list-row";

const listInclude = {
  requestType: true,
  requestor: true,
  marketingOwner: true,
} satisfies Prisma.RequestInclude;

type RequestWithRelations = Prisma.RequestGetPayload<{ include: typeof listInclude }>;

export function toListItem(r: RequestWithRelations): RequestListItem {
  return {
    id: r.id,
    title: r.title,
    status: r.status,
    priority: r.priority,
    confidential: r.confidential,
    targetDate: r.targetDate,
    requestTypeLabel: r.requestType.label,
    requestorName: r.requestor.name,
    marketingOwnerName: r.marketingOwner?.name ?? null,
    marketingOwnerColor: r.marketingOwner?.avatarColor ?? null,
  };
}

export { listInclude };
