import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isMarketing } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrochureIntakeForm } from "@/components/brochure/intake-form";
import { SectionEditor } from "@/components/brochure/section-editor";
import { FilesPanel } from "@/components/requests/files-panel";
import type { StoredSection } from "@/lib/brochure/sections";
import { IMPORTANT_FACT_KEYS } from "@/lib/brochure/sections";

export default async function BrochureStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const request = await db.request.findUnique({
    where: { id },
    include: {
      requestor: true,
      participants: true,
      brochureProject: { include: { property: true } },
      files: { include: { uploadedBy: true } },
      property: true,
    },
  });
  if (!request || request.requestTypeKey !== "brochure") notFound();

  const marketing = isMarketing(user);
  const isParticipant = request.requestorId === user.id || request.participants.some((p) => p.userId === user.id);
  if (!marketing && !isParticipant) notFound();

  if (!request.brochureProject) {
    const properties = await db.property.findMany({ orderBy: { name: "asc" } });
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/brochure-studio" className="text-sm text-muted-foreground hover:text-foreground">← Back to Brochure Studio</Link>
          <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">{request.title}</h1>
        </div>
        <BrochureIntakeForm requestId={request.id} properties={properties} />
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Supporting files</CardTitle></CardHeader>
          <CardContent>
            <FilesPanel
              requestId={request.id}
              canEdit
              assetTypeOptions={["existing_copy", "floorplan", "map", "technical_document", "brochure", "hero_image", "additional_photography", "other"]}
              files={request.files.map((f) => ({ id: f.id, filename: f.filename, assetTypeTag: f.assetTypeTag, mimeType: f.mimeType, uploadedByName: f.uploadedBy.name, createdAt: f.createdAt.toISOString() }))}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = request.brochureProject;
  const facts = JSON.parse(project.suppliedFacts) as Record<string, string>;
  const missingInfo = JSON.parse(project.missingInfo) as string[];
  const sections = JSON.parse(project.sections) as StoredSection[];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div>
          <Link href="/brochure-studio" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
          <h1 className="mt-2 font-display text-xl font-medium tracking-tight">{request.title}</h1>
          <p className="text-sm text-muted-foreground">{project.propertyType}</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Supplied facts</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {IMPORTANT_FACT_KEYS.map((f) => facts[f.key] ? (
              <div key={f.key} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <span><span className="text-muted-foreground">{f.label}:</span> {facts[f.key]}</span>
              </div>
            ) : null)}
          </CardContent>
        </Card>

        {missingInfo.length > 0 && (
          <Card className="border-warning/30 bg-warning-soft/40">
            <CardHeader><CardTitle className="text-sm font-medium">Missing information</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {missingInfo.map((m) => (
                <div key={m} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  {m}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Files</CardTitle></CardHeader>
          <CardContent>
            <FilesPanel
              requestId={request.id}
              canEdit
              assetTypeOptions={["existing_copy", "floorplan", "map", "technical_document", "brochure", "hero_image", "additional_photography", "other"]}
              files={request.files.map((f) => ({ id: f.id, filename: f.filename, assetTypeTag: f.assetTypeTag, mimeType: f.mimeType, uploadedByName: f.uploadedBy.name, createdAt: f.createdAt.toISOString() }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {sections.map((s) => (
          <SectionEditor key={s.key} brochureProjectId={project.id} sectionKey={s.key} label={s.label} versions={s.versions} />
        ))}
      </div>
    </div>
  );
}
