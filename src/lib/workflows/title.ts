import { getWorkflowDefinition } from "./definitions";

const TITLE_CANDIDATE_KEYS = [
  "propertyName", "eventName", "campaignName", "reportTitle", "idea", "subject", "topic", "description", "deliverable",
];

export function computeRequestTitle(typeKey: string, values: Record<string, unknown>): string {
  for (const key of TITLE_CANDIDATE_KEYS) {
    const v = values[key];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 140);
  }
  const def = getWorkflowDefinition(typeKey);
  return def ? `New ${def.typeKey.replace(/_/g, " ")} request` : "New request";
}
