export type AITask =
  | "brief_summary"
  | "brief_gap_check"
  | "pr_angle"
  | "op_ed_analysis"
  | "social_copy"
  | "email_copy"
  | "brochure_section"
  | "tender_analysis"
  | "pitch_draft_section"
  | "asset_tag_suggestions";

export interface AIRequest<TContext = Record<string, unknown>> {
  task: AITask;
  context: TContext;
}

export interface AIResult<TData = unknown> {
  data: TData;
  /** Always surfaced next to AI output — Marketing retains final responsibility. */
  disclaimer: string;
  generatedByAI: true;
}

// Every AI-touching feature in the app calls this interface only. The MVP
// default is MockAIProvider (deterministic, fact-grounded, no external
// calls). A real provider (Anthropic, Azure OpenAI, Bedrock, ...) can be
// dropped in later by implementing the same method and switching
// AI_PROVIDER — no caller elsewhere in the app changes.
export interface AIProvider {
  generate<TData = unknown>(request: AIRequest): Promise<AIResult<TData>>;
}

export const AI_DISCLAIMER =
  "AI-generated draft based only on the information supplied. Review and verify before use — Marketing retains final responsibility for accuracy and tone.";
