import Link from "next/link";
import { ArrowRight, CalendarClock, FolderSearch, ListChecks, PlusCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { visibleRequestsWhere } from "@/lib/requests/visibility";
import { listInclude, toListItem } from "@/lib/requests/queries";
import { RequestListRow } from "@/components/requests/request-list-row";
import { RequestTypeCard } from "@/components/requests/request-type-card";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function HomePage() {
  const user = await requireUser();
  const baseWhere = visibleRequestsWhere(user);

  const [types, activeRequests, awaitingYou] = await Promise.all([
    db.requestTypeDefinition.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.request.findMany({
      where: { AND: [baseWhere, { status: { notIn: ["COMPLETE", "DRAFT"] } }] },
      include: listInclude,
      orderBy: [{ targetDate: "asc" }],
      take: 5,
    }),
    db.request.findMany({
      where: {
        status: "AWAITING_REQUESTOR",
        OR: [{ requestorId: user.id }, { participants: { some: { userId: user.id } } }],
      },
      include: listInclude,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">
          {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">What do you need help with today?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {types.map((t) => (
          <RequestTypeCard key={t.key} typeKey={t.key} label={t.label} description={t.description} icon={t.icon} compact />
        ))}
      </div>

      {awaitingYou.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <h2 className="font-display text-lg font-medium">Awaiting You</h2>
          </div>
          <div className="space-y-2">
            {awaitingYou.map((r) => (
              <RequestListRow key={r.id} item={toListItem(r)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">My Active Requests</h2>
          <Link href="/requests" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {activeRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <ListChecks className="h-7 w-7 text-muted-foreground/50" />
              <div className="text-sm text-muted-foreground">No active requests — start one above.</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeRequests.map((r) => (
              <RequestListRow key={r.id} item={toListItem(r)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-medium">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction href="/create" icon={PlusCircle} label="Start a request" />
          <QuickAction href="/brochure-studio" icon={ListChecks} label="Create content" />
          <QuickAction href="/library" icon={FolderSearch} label="Find an asset" />
          <QuickAction href="/requests" icon={CalendarClock} label="View my requests" />
        </div>
      </section>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof PlusCircle; label: string }) {
  return (
    <Link href={href}>
      <Card className="flex flex-col items-center gap-2 px-4 py-5 text-center transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
        <Icon className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </Card>
    </Link>
  );
}
