import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { RequestTypeCard } from "@/components/requests/request-type-card";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default async function CreatePage() {
  const user = await requireUser();

  const [types, drafts] = await Promise.all([
    db.requestTypeDefinition.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.request.findMany({
      where: { requestorId: user.id, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      include: { requestType: true },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">What do you need help with?</h1>
        <p className="mt-1.5 text-muted-foreground">
          Choose a request type below. The form only asks what&apos;s relevant — Marketing gets a complete brief the
          first time.
        </p>
      </div>

      {drafts.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Continue a draft</h2>
          <div className="space-y-2">
            {drafts.map((d) => (
              <Link key={d.id} href={`/requests/${d.id}/edit`}>
                <Card className="flex items-center justify-between px-4 py-3 transition-colors hover:border-accent/40">
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.requestType.label} · last edited {formatDate(d.updatedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={d.status} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((t) => (
          <RequestTypeCard key={t.key} typeKey={t.key} label={t.label} description={t.description} icon={t.icon} />
        ))}
      </div>

      <Card className="bg-surface-sunken/60 border-dashed">
        <CardContent className="flex flex-col items-start gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">Not sure which type fits?</div>
            <div className="text-sm text-muted-foreground">Choose &quot;Other Marketing Request&quot; and Marketing will redirect it if needed.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
