import Link from "next/link";
import { Trophy, Sparkles, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { visibleRequestsWhere } from "@/lib/requests/visibility";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { startDraft } from "@/lib/requests/actions";

export default async function PitchStudioIndexPage() {
  const user = await requireUser();
  const requests = await db.request.findMany({
    where: { AND: [visibleRequestsWhere(user), { requestTypeKey: "pitch_tender" }] },
    include: { client: true, pitchProject: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Pitch Studio</h1>
          <p className="mt-1 text-muted-foreground">Tender analysis, structure and first drafts — kept private to your pitch team.</p>
        </div>
        <form action={startDraft}>
          <input type="hidden" name="typeKey" value="pitch_tender" />
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover">
            <Sparkles className="h-4 w-4" /> New pitch
          </button>
        </form>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground/50" />
            <div className="font-medium">No pitches yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">Start one above to analyse a tender and build a first draft.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/pitch-studio/${r.id}`}>
              <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:border-accent/40">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    {r.confidential && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    {r.title}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.client?.name ?? "No client linked"} · {formatDate(r.createdAt)}
                </div>
                {!r.pitchProject && <div className="text-xs font-medium text-accent">Analysis required</div>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
