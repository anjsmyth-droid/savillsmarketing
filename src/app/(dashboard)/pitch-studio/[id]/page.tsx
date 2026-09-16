import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isMarketing } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PitchIntakeForm } from "@/components/pitch/intake-form";
import { InterviewForm } from "@/components/pitch/interview-form";
import { GenerateAllDraftsButton, GenerateStructureButton } from "@/components/pitch/generate-buttons";
import { PitchSectionEditor } from "@/components/pitch/pitch-section-editor";
import { FilesPanel } from "@/components/requests/files-panel";
import { formatDate } from "@/lib/utils";
import type { TenderAnalysisResult } from "@/lib/pitch/actions";

export default async function PitchStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const request = await db.request.findUnique({
    where: { id },
    include: {
      requestor: true,
      participants: true,
      pitchProject: true,
      files: { include: { uploadedBy: true } },
    },
  });
  if (!request || request.requestTypeKey !== "pitch_tender") notFound();

  const marketing = isMarketing(user);
  const isParticipant = request.requestorId === user.id || request.participants.some((p) => p.userId === user.id);
  if (!marketing && !isParticipant) notFound();

  const fileList = request.files.map((f) => ({ id: f.id, filename: f.filename, assetTypeTag: f.assetTypeTag, mimeType: f.mimeType, uploadedByName: f.uploadedBy.name, createdAt: f.createdAt.toISOString() }));

  if (!request.pitchProject) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/pitch-studio" className="text-sm text-muted-foreground hover:text-foreground">← Back to Pitch Studio</Link>
          <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">{request.title}</h1>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Source documents</CardTitle></CardHeader>
          <CardContent>
            <FilesPanel
              requestId={request.id}
              canEdit
              assetTypeOptions={["technical_document", "existing_copy", "other"]}
              files={fileList}
            />
          </CardContent>
        </Card>
        <PitchIntakeForm requestId={request.id} />
      </div>
    );
  }

  const project = request.pitchProject;
  const analysis = JSON.parse(project.analysis) as Partial<TenderAnalysisResult>;
  const interviewAnswers = JSON.parse(project.interviewAnswers) as Record<string, string>;
  const structure = JSON.parse(project.structure) as string[];
  const draftContent = JSON.parse(project.draftContent) as Record<string, string>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/pitch-studio" className="text-sm text-muted-foreground hover:text-foreground">← Back to Pitch Studio</Link>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">{request.title}</h1>
        <p className="text-sm text-muted-foreground">
          {project.clientName} · {project.opportunityName}
          {project.submissionDeadline ? ` · Due ${formatDate(project.submissionDeadline)}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tender analysis</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Submission deadline</div>
              <div className="text-sm font-medium">{analysis.submissionDeadline ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Word/page limits</div>
              <div className="text-sm font-medium">{analysis.wordOrPageLimits ?? "—"}</div>
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Evaluation criteria</div>
            <div className="flex flex-wrap gap-1.5">{analysis.evaluationCriteria?.map((c) => <Badge key={c} variant="neutral">{c}</Badge>)}</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Mandatory sections</div>
            <div className="flex flex-wrap gap-1.5">{analysis.mandatorySections?.map((c) => <Badge key={c} variant="neutral">{c}</Badge>)}</div>
          </div>
          {!!analysis.informationGaps?.length && (
            <div className="rounded-md border border-warning/30 bg-warning-soft/40 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-warning"><AlertTriangle className="h-3.5 w-3.5" /> Information gaps</div>
              <ul className="space-y-0.5 text-sm">{analysis.informationGaps.map((g) => <li key={g}>{g}</li>)}</ul>
            </div>
          )}
          {!!analysis.clarificationQuestions?.length && (
            <div className="rounded-md border border-info/30 bg-info-soft/40 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-info"><HelpCircle className="h-3.5 w-3.5" /> Clarification questions</div>
              <ul className="space-y-0.5 text-sm">{analysis.clarificationQuestions.map((g) => <li key={g}>{g}</li>)}</ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Source documents</CardTitle></CardHeader>
        <CardContent>
          <FilesPanel requestId={request.id} canEdit assetTypeOptions={["technical_document", "existing_copy", "other"]} files={fileList} />
        </CardContent>
      </Card>

      <InterviewForm pitchProjectId={project.id} initialAnswers={interviewAnswers} />

      {structure.length === 0 ? (
        <GenerateStructureButton pitchProjectId={project.id} />
      ) : Object.keys(draftContent).length === 0 ? (
        <div className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Pitch structure</CardTitle></CardHeader>
            <CardContent>
              <ol className="list-inside list-decimal space-y-1 text-sm">{structure.map((s) => <li key={s}>{s}</li>)}</ol>
            </CardContent>
          </Card>
          <GenerateAllDraftsButton pitchProjectId={project.id} />
        </div>
      ) : (
        <div className="space-y-4">
          {structure.map((s) => (
            <PitchSectionEditor key={s} pitchProjectId={project.id} sectionName={s} body={draftContent[s] ?? ""} />
          ))}
        </div>
      )}
    </div>
  );
}
