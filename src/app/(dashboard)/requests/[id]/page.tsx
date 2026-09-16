import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isMarketing } from "@/lib/auth";
import { getWorkflowDefinition } from "@/lib/workflows/definitions";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, relativeTime } from "@/lib/utils";
import { statusProgressPercent } from "@/lib/status";
import { MarketingControls } from "@/components/requests/marketing-controls";
import { CommentComposer } from "@/components/requests/comment-composer";
import { FilesPanel } from "@/components/requests/files-panel";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const request = await db.request.findUnique({
    where: { id },
    include: {
      requestType: true,
      requestor: true,
      marketingOwner: true,
      creativeOwner: true,
      property: true,
      client: true,
      campaign: true,
      participants: { include: { user: true } },
      statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      files: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
      approvals: { include: { approver: true, requestedBy: true }, orderBy: { createdAt: "desc" } },
      contentItems: { include: { versions: { orderBy: { versionNumber: "desc" } } } },
      brochureProject: true,
      pitchProject: true,
    },
  });
  if (!request) notFound();

  const marketing = isMarketing(user);
  const isParticipant = request.requestorId === user.id || request.participants.some((p) => p.userId === user.id);
  if (request.confidential && !marketing && !isParticipant) notFound();

  if (request.status === "DRAFT") {
    if (request.requestorId === user.id) redirect(`/requests/${id}/edit`);
    notFound();
  }

  const def = getWorkflowDefinition(request.requestTypeKey);
  const values = JSON.parse(request.formData) as Record<string, unknown>;
  const fieldLabels = new Map<string, string>();
  def?.steps.forEach((s) => s.fields.forEach((f) => { if (f.type !== "file-upload") fieldLabels.set(f.key, f.label); }));

  const visibleComments = request.comments.filter((c) => marketing || c.visibility === "REQUESTOR");

  const [marketingTeam, creativeTeam] = marketing
    ? await Promise.all([
        db.user.findMany({ where: { role: { in: ["MARKETING", "MARKETING_ADMIN"] }, active: true }, select: { id: true, name: true } }),
        db.user.findMany({ where: { department: { isCreativeTeam: true }, active: true }, select: { id: true, name: true } }),
      ])
    : [[], []];

  const assetTypes = await db.assetTypeDefinition.findMany({ orderBy: { name: "asc" } });
  const assetTypeTags = assetTypes.length
    ? assetTypes.map((a) => a.name.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, ""))
    : ["other"];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/requests" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to requests
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {request.confidential && <Lock className="h-4 w-4 text-muted-foreground" />}
            <h1 className="font-display text-2xl font-medium tracking-tight">{request.title}</h1>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{request.requestType.label}</span>
            <span>·</span>
            <span>Requested by {request.requestor.name}</span>
            <span>·</span>
            <span>{formatDate(request.submittedAt ?? request.createdAt)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <PriorityBadge priority={request.priority} />
          <StatusBadge status={request.status} />
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <Progress value={statusProgressPercent(request.status)} />
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">Marketing owner</div>
              <div className="mt-1 flex items-center gap-2">
                {request.marketingOwner ? (
                  <>
                    <Avatar name={request.marketingOwner.name} color={request.marketingOwner.avatarColor} size="sm" />
                    <span className="text-sm font-medium">{request.marketingOwner.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Due date</div>
              <div className="mt-1 text-sm font-medium">{formatDate(request.targetDate)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Client</div>
              <div className="mt-1 text-sm font-medium">{request.client?.name ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Property</div>
              <div className="mt-1 text-sm font-medium">{request.property?.name ?? "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(request.requestTypeKey === "brochure" || request.requestTypeKey === "pitch_tender") && (
        <Card className="border-accent/30 bg-accent-soft/40">
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm">
              This is a {request.requestTypeKey === "brochure" ? "Brochure Studio" : "Pitch Studio"} project — content is
              generated and managed there.
            </div>
            <Link
              href={request.requestTypeKey === "brochure" ? `/brochure-studio/${request.id}` : `/pitch-studio/${request.id}`}
              className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Open studio <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="files">Files ({request.files.length})</TabsTrigger>
          <TabsTrigger value="content">Content ({request.contentItems.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="approvals">Approvals ({request.approvals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          {request.briefSummary && (
            <Card className="border-accent/30 bg-accent-soft/30">
              <CardHeader>
                <CardTitle className="text-sm font-medium">AI brief summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-foreground/90">{request.briefSummary}</CardContent>
            </Card>
          )}

          {marketing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Marketing controls</CardTitle>
              </CardHeader>
              <CardContent>
                <MarketingControls
                  requestId={request.id}
                  status={request.status}
                  priority={request.priority}
                  marketingOwnerId={request.marketingOwnerId}
                  creativeOwnerId={request.creativeOwnerId}
                  marketingTeam={marketingTeam}
                  creativeTeam={creativeTeam}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {[request.requestor, ...request.participants.map((p) => p.user)]
                .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
                .map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm">
                    <Avatar name={p.name} color={p.avatarColor} size="sm" />
                    {p.name}
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brief" className="mt-5">
          <Card>
            <CardContent className="py-5">
              {def ? (
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  {Array.from(fieldLabels.entries()).map(([key, label]) => {
                    const v = values[key];
                    if (v === undefined || v === null || v === "") return null;
                    return (
                      <div key={key}>
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="mt-0.5 text-sm font-medium whitespace-pre-wrap">
                          {typeof v === "boolean" ? (v ? "Yes" : "No") : Array.isArray(v) ? v.join(", ") : String(v)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Brief details are managed in the dedicated studio for this request type.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-5">
          <FilesPanel
            requestId={request.id}
            assetTypeOptions={assetTypeTags}
            canEdit={isParticipant || marketing}
            files={request.files.map((f) => ({
              id: f.id,
              filename: f.filename,
              assetTypeTag: f.assetTypeTag,
              mimeType: f.mimeType,
              uploadedByName: f.uploadedBy.name,
              createdAt: f.createdAt.toISOString(),
            }))}
          />
        </TabsContent>

        <TabsContent value="content" className="mt-5 space-y-4">
          {request.contentItems.length === 0 ? (
            <div className="rounded-lg border border-border py-12 text-center text-sm text-muted-foreground">
              No content drafted yet.
            </div>
          ) : (
            request.contentItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.versions.map((v) => (
                    <div key={v.id} className="rounded-md border border-border p-3">
                      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Version {v.versionNumber}</span>
                        {v.generatedByAI && <Badge variant="accent">AI generated</Badge>}
                        {v.status === "APPROVED" && <Badge variant="success">Approved</Badge>}
                        <span>· {formatDateTime(v.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{v.body}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5 space-y-5">
          <Card>
            <CardContent className="py-4">
              <CommentComposer requestId={request.id} canPostInternal={marketing} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {[
              ...request.statusHistory.map((h) => ({
                kind: "status" as const,
                date: h.createdAt,
                node: (
                  <span>
                    <span className="font-medium">{h.changedBy.name}</span> changed status to <StatusBadge status={h.toStatus} />
                    {h.note ? ` — ${h.note}` : ""}
                  </span>
                ),
              })),
              ...visibleComments.map((c) => ({
                kind: "comment" as const,
                date: c.createdAt,
                node: (
                  <span>
                    <span className="font-medium">{c.author.name}</span>
                    {c.visibility === "INTERNAL" && <Badge variant="outline" className="ml-2">Internal</Badge>}
                    <div className="mt-1 whitespace-pre-wrap text-foreground/90">{c.body}</div>
                  </span>
                ),
              })),
            ]
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((entry, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-24 shrink-0 pt-0.5 text-xs text-muted-foreground">{relativeTime(entry.date)}</div>
                  <div className="flex-1 border-l border-border pl-4">{entry.node}</div>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="mt-5 space-y-3">
          {request.approvals.length === 0 ? (
            <div className="rounded-lg border border-border py-12 text-center text-sm text-muted-foreground">
              No approvals requested yet.
            </div>
          ) : (
            request.approvals.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">{a.itemLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      Requested from {a.approver.name} by {a.requestedBy.name} · {formatDateTime(a.createdAt)}
                    </div>
                    {a.note && <div className="mt-1 text-sm text-muted-foreground">&quot;{a.note}&quot;</div>}
                  </div>
                  <Badge variant={a.status === "APPROVED" ? "success" : a.status === "CHANGES_REQUESTED" ? "danger" : "warning"}>
                    {a.status === "PENDING" ? "Pending" : a.status === "APPROVED" ? "Approved" : "Changes requested"}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
