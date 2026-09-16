import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { visibleRequestsWhere } from "@/lib/requests/visibility";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { startDraft } from "@/lib/requests/actions";

export default async function BrochureStudioIndexPage() {
  const user = await requireUser();
  const requests = await db.request.findMany({
    where: { AND: [visibleRequestsWhere(user), { requestTypeKey: "brochure" }] },
    include: { property: true, brochureProject: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Brochure Studio</h1>
          <p className="mt-1 text-muted-foreground">AI-assisted first drafts, grounded only in the facts you supply.</p>
        </div>
        <form action={startDraft}>
          <input type="hidden" name="typeKey" value="brochure" />
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover">
            <Sparkles className="h-4 w-4" /> New brochure
          </button>
        </form>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
            <div className="font-medium">No brochures yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">Start one above — you&apos;ll be asked for the property details and can generate a first draft in minutes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/brochure-studio/${r.id}`}>
              <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:border-accent/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.title}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.property?.name ?? "No property linked"} · {formatDate(r.createdAt)}
                </div>
                {!r.brochureProject && <div className="text-xs font-medium text-accent">Set up required</div>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
