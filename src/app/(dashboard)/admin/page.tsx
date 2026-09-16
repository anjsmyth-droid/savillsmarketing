import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { KanbanBoard, type KanbanCardData } from "@/components/admin/kanban-board";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function ControlCentrePage() {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [open, newCount, dueThisWeek, awaitingMarketing, awaitingRequestor, overdue, completedThisMonth, requests] = await Promise.all([
    db.request.count({ where: { status: { notIn: ["DRAFT", "COMPLETE"] } } }),
    db.request.count({ where: { status: "SUBMITTED" } }),
    db.request.count({ where: { status: { notIn: ["DRAFT", "COMPLETE"] }, targetDate: { gte: now, lte: weekFromNow } } }),
    db.request.count({ where: { status: { in: ["SUBMITTED", "BRIEF_REVIEW", "IN_PROGRESS", "DRAFT_READY"] } } }),
    db.request.count({ where: { status: "AWAITING_REQUESTOR" } }),
    db.request.count({ where: { status: { notIn: ["DRAFT", "COMPLETE"] }, targetDate: { lt: now } } }),
    db.request.count({ where: { status: "COMPLETE", completedAt: { gte: startOfMonth() } } }),
    db.request.findMany({
      where: { status: { notIn: ["DRAFT"] } },
      include: { requestType: true, requestor: { include: { department: true } }, marketingOwner: true },
      orderBy: { targetDate: "asc" },
    }),
  ]);

  const cards: KanbanCardData[] = requests.map((r) => ({
    id: r.id,
    title: r.title,
    requestTypeLabel: r.requestType.label,
    division: r.requestor.department?.name ?? null,
    requestorName: r.requestor.name,
    marketingOwnerName: r.marketingOwner?.name ?? null,
    marketingOwnerColor: r.marketingOwner?.avatarColor ?? null,
    targetDate: r.targetDate ? r.targetDate.toISOString() : null,
    priority: r.priority,
    confidential: r.confidential,
    status: r.status,
  }));

  const stats = [
    { label: "Open Requests", value: open },
    { label: "New", value: newCount },
    { label: "Due This Week", value: dueThisWeek },
    { label: "Awaiting Marketing", value: awaitingMarketing },
    { label: "Awaiting Requestor", value: awaitingRequestor },
    { label: "Overdue", value: overdue, danger: overdue > 0 },
    { label: "Completed This Month", value: completedThisMonth },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Marketing Control Centre</h1>
        <p className="mt-1 text-muted-foreground">Everything the team is working on, at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4">
              <div className={`text-2xl font-display font-medium ${s.danger ? "text-danger" : ""}`}>{s.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <p className="mb-3 text-sm text-muted-foreground">Drag cards between columns to update status.</p>
        <KanbanBoard initialCards={cards} />
      </div>
    </div>
  );
}
