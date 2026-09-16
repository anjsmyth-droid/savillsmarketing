export type InsightTask = "pr_angle" | "op_ed_analysis" | "social_copy" | "email_copy";

export const TASK_BY_TYPE: Record<string, { task: InsightTask; label: string }> = {
  property_pr: { task: "pr_angle", label: "AI PR angle" },
  pr_media: { task: "pr_angle", label: "AI PR angle" },
  op_ed: { task: "op_ed_analysis", label: "AI op-ed analysis" },
  social_media: { task: "social_copy", label: "AI draft social copy" },
  email_campaign: { task: "email_copy", label: "AI draft email copy" },
};

export function insightConfigFor(requestTypeKey: string) {
  return TASK_BY_TYPE[requestTypeKey] ?? null;
}
