import { db } from "@/lib/db";
import type { WorkflowDefinition, WorkflowField } from "./types";

export async function resolveWorkflowDefinition(def: WorkflowDefinition): Promise<WorkflowDefinition> {
  const [mediaOutlets, serviceLines, assetTypes] = await Promise.all([
    db.mediaOutlet.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.serviceLine.findMany({ orderBy: { name: "asc" } }),
    db.assetTypeDefinition.findMany({ orderBy: { name: "asc" } }),
  ]);

  const sourceMap: Record<string, { value: string; label: string }[]> = {
    mediaOutlets: mediaOutlets.map((m) => ({ value: m.name, label: `${m.name} (${m.category})` })),
    serviceLines: serviceLines.map((s) => ({ value: s.name, label: s.name })),
    assetTypes: assetTypes.map((a) => ({ value: a.name, label: a.name })),
  };

  const resolveField = (field: WorkflowField): WorkflowField =>
    field.optionsSource ? { ...field, options: sourceMap[field.optionsSource] } : field;

  return {
    ...def,
    steps: def.steps.map((step) => ({ ...step, fields: step.fields.map(resolveField) })),
  };
}
