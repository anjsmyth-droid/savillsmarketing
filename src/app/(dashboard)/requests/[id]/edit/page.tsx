import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getWorkflowDefinition } from "@/lib/workflows/definitions";
import { resolveWorkflowDefinition } from "@/lib/workflows/resolve";
import { WorkflowForm } from "@/components/requests/workflow-form";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const request = await db.request.findUnique({
    where: { id },
    include: { requestType: true, files: true },
  });
  if (!request) notFound();
  if (request.requestorId !== user.id) redirect(`/requests/${id}`);
  if (request.status !== "DRAFT") redirect(`/requests/${id}`);

  const def = getWorkflowDefinition(request.requestTypeKey);
  if (!def) notFound();
  const resolved = await resolveWorkflowDefinition(def);

  return (
    <WorkflowForm
      requestId={request.id}
      typeLabel={request.requestType.label}
      steps={resolved.steps}
      initialValues={JSON.parse(request.formData)}
      initialFiles={request.files.map((f) => ({ id: f.id, filename: f.filename, assetTypeTag: f.assetTypeTag }))}
    />
  );
}
