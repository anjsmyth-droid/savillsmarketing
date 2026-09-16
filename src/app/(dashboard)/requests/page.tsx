import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { visibleRequestsWhere } from "@/lib/requests/visibility";
import { listInclude, toListItem } from "@/lib/requests/queries";
import { RequestListRow } from "@/components/requests/request-list-row";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

const TABS = [
  { key: "active", label: "Active" },
  { key: "awaiting_you", label: "Awaiting You" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
] as const;

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "active" } = await searchParams;
  const user = await requireUser();

  const baseWhere = visibleRequestsWhere(user);
  const statusFilter: Prisma.RequestWhereInput =
    tab === "completed"
      ? { status: "COMPLETE" }
      : tab === "awaiting_you"
        ? { status: "AWAITING_REQUESTOR", OR: [{ requestorId: user.id }, { participants: { some: { userId: user.id } } }] }
        : tab === "active"
          ? { status: { notIn: ["COMPLETE", "DRAFT"] } }
          : {};

  const requests = await db.request.findMany({
    where: { AND: [baseWhere, statusFilter] },
    include: listInclude,
    orderBy: [{ targetDate: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Requests</h1>
          <p className="mt-1 text-muted-foreground">Every request you&apos;ve raised or are involved in.</p>
        </div>
        <nav className="flex gap-1 rounded-lg bg-surface-sunken p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/requests?tab=${t.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key ? "bg-surface shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
            <div className="font-medium">Nothing here yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              {tab === "awaiting_you"
                ? "You're all caught up — nothing needs your attention right now."
                : "Start a new request from the Create page to see it appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <RequestListRow key={r.id} item={toListItem(r)} />
          ))}
        </div>
      )}
    </div>
  );
}
