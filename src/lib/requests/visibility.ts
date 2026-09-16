import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { isMarketing } from "@/lib/auth";

/**
 * Central request-visibility rule, used by every list/search query so
 * confidentiality is enforced at the data layer rather than in the UI.
 * Marketing sees everything (they administer requests); everyone else
 * sees their own requests, requests they participate in, and — for
 * divisional users — non-confidential requests from their department.
 */
export function visibleRequestsWhere(user: SessionUser): Prisma.RequestWhereInput {
  if (isMarketing(user)) return {};

  const or: Prisma.RequestWhereInput[] = [
    { requestorId: user.id },
    { participants: { some: { userId: user.id } } },
  ];

  if (user.role === "DIVISIONAL" && user.departmentId) {
    or.push({ confidential: false, requestor: { departmentId: user.departmentId } });
  }

  return { OR: or };
}
