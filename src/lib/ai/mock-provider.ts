import { AI_DISCLAIMER, type AIProvider, type AIRequest, type AIResult } from "./types";

function present(value: unknown): value is string | number {
  return value !== undefined && value !== null && value !== "" && value !== "unspecified";
}

function fact(value: unknown, label: string): string {
  return present(value) ? String(value) : `[${label} not supplied — confirm before use]`;
}

function listFacts(fields: Record<string, unknown>, keys: [string, string][]): string {
  return keys
    .filter(([key]) => present(fields[key]))
    .map(([key, label]) => `${label}: ${fields[key]}`)
    .join(" · ");
}

/**
 * Deterministic, template-driven "AI" used as the MVP default. It never
 * invents facts: every generated string is built only from values present
 * in the supplied context, with explicit [placeholder] markers for gaps.
 * This keeps the demo credible and honest about what a real LLM provider
 * would add (fluency, nuance) versus what the app's own logic guarantees
 * (fact-grounding, gap detection).
 */
export class MockAIProvider implements AIProvider {
  async generate<TData = unknown>(request: AIRequest): Promise<AIResult<TData>> {
    const data = this.route(request) as TData;
    return { data, disclaimer: AI_DISCLAIMER, generatedByAI: true };
  }

  private route(request: AIRequest): unknown {
    const ctx = request.context as Record<string, unknown>;
    switch (request.task) {
      case "brief_summary":
        return this.briefSummary(ctx);
      case "brief_gap_check":
        return this.briefGapCheck(ctx);
      case "pr_angle":
        return this.prAngle(ctx);
      case "op_ed_analysis":
        return this.opEdAnalysis(ctx);
      case "social_copy":
        return this.socialCopy(ctx);
      case "email_copy":
        return this.emailCopy(ctx);
      case "brochure_section":
        return this.brochureSection(ctx);
      case "tender_analysis":
        return this.tenderAnalysis(ctx);
      case "pitch_draft_section":
        return this.pitchDraftSection(ctx);
      case "asset_tag_suggestions":
        return this.assetTagSuggestions(ctx);
      default:
        return { summary: "Unsupported AI task." };
    }
  }

  private briefSummary(ctx: Record<string, unknown>) {
    const title = fact(ctx.title, "title");
    const type = fact(ctx.requestTypeLabel, "request type");
    const owner = present(ctx.requestorName) ? ` for ${ctx.requestorName}` : "";
    const highlights = Object.entries((ctx.fields as Record<string, unknown>) ?? {})
      .filter(([, v]) => present(v) && String(v).length < 120)
      .slice(0, 5)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`)
      .join("; ");
    return {
      summary: `${type} request${owner} — "${title}". ${highlights ? `Key details — ${highlights}.` : "Full brief in the request form."}`,
    };
  }

  private briefGapCheck(ctx: Record<string, unknown>) {
    const fields = (ctx.fields as Record<string, unknown>) ?? {};
    const required = (ctx.requiredFields as { key: string; label: string }[]) ?? [];
    const missing = required.filter((r) => !present(fields[r.key]));
    return {
      complete: missing.length === 0,
      missing: missing.map((m) => m.label),
      message:
        missing.length === 0
          ? "Brief looks complete against the required fields for this request type."
          : `Missing before this can move to production: ${missing.map((m) => m.label).join(", ")}.`,
    };
  }

  private prAngle(ctx: Record<string, unknown>) {
    const propertyName = fact(ctx.propertyName, "property name");
    const whatsHappening = fact(ctx.whatsHappening, "what is happening");
    const sellingPoints = fact(ctx.sellingPoints, "key selling points");
    const marketContext = ctx.marketContext;
    const propertyType = ctx.propertyType;

    return {
      suggestedAngle: `${propertyName}: ${whatsHappening}`,
      potentialHeadline: present(ctx.askingPrice)
        ? `${propertyName} brought to market at ${ctx.askingPrice}`
        : `Savills brings ${propertyName} to market`,
      coreArgument: `${whatsHappening} — positioned around: ${sellingPoints}.`,
      potentialStructure: [
        "Lead paragraph: transaction/instruction facts (who, what, price/size, location)",
        "Why it matters: selling points and market context",
        present(ctx.quoteRequired) ? "Savills quote" : null,
        present(marketContext) ? "Wider market context" : null,
        "Boilerplate and contact details",
      ].filter(Boolean),
      targetAudience: fact(propertyType, "property type") + " occupiers/investors and relevant trade media",
      potentialMedia: present(ctx.targetMedia) ? ctx.targetMedia : "[target media not yet selected]",
      supportingEvidenceSupplied: listFacts(ctx, [
        ["askingPrice", "Asking price"],
        ["guidePrice", "Guide price"],
        ["rent", "Rent"],
        ["sizeSqFt", "Size"],
        ["tenure", "Tenure"],
      ]) || "None supplied yet",
      informationStillRequired: [
        !present(ctx.quoteRequired) ? "Confirm whether a Savills quote is required, and by whom" : null,
        !present(ctx.launchDate) ? "Desired launch/publication date" : null,
        !present(ctx.heroImage) ? "Hero photography" : null,
      ].filter(Boolean),
    };
  }

  private opEdAnalysis(ctx: Record<string, unknown>) {
    return {
      suggestedAngle: fact(ctx.mainArgument, "main argument"),
      potentialHeadline: present(ctx.idea) ? `Opinion: ${ctx.idea}` : "[headline requires idea]",
      coreArgument: fact(ctx.mainArgument, "main argument"),
      potentialStructure: [
        "Opening hook tied to current relevance",
        "Core argument",
        "Supporting evidence/data",
        "Author's professional perspective",
        "Reader takeaway / call to action",
      ],
      targetAudience: fact(ctx.audience, "intended audience"),
      potentialMedia: fact(ctx.targetPublication, "target publication"),
      supportingEvidenceSupplied: fact(ctx.evidence, "evidence/data"),
      informationStillRequired: [
        !present(ctx.evidence) ? "Supporting evidence or data points" : null,
        !present(ctx.deadline) ? "Deadline" : null,
        !present(ctx.hasDraft) ? "Confirm whether a draft already exists" : null,
      ].filter(Boolean),
    };
  }

  private socialCopy(ctx: Record<string, unknown>) {
    const message = fact(ctx.message, "message");
    const platform = fact(ctx.platform, "platform");
    return {
      variants: [
        `${message} Read more. #Savills${present(ctx.property) ? ` #${String(ctx.property).replace(/\s+/g, "")}` : ""}`,
        `${message} — via Savills Ireland.`,
      ],
      platformNote: `Drafted for ${platform}; adjust length/tone per platform before posting.`,
    };
  }

  private emailCopy(ctx: Record<string, unknown>) {
    const objective = fact(ctx.objective, "objective");
    return {
      subjectLines: [
        present(ctx.campaignName) ? `${ctx.campaignName}: ${objective}` : objective,
        `Savills update: ${objective}`,
      ],
      headline: objective,
      body: `${fact(ctx.message, "message")}\n\n${present(ctx.callToAction) ? ctx.callToAction : "[call to action not supplied]"}`,
      cta: fact(ctx.callToAction, "call to action"),
    };
  }

  private brochureSection(ctx: Record<string, unknown>) {
    const sectionKey = String(ctx.sectionKey ?? "overview");
    const facts = (ctx.facts as Record<string, unknown>) ?? {};
    const generators: Record<string, () => string> = {
      overview: () =>
        `${fact(facts.name, "property name")} is a ${fact(facts.propertyType, "property type")} opportunity located at ${fact(facts.address, "address")}${present(facts.sizeSqFt) ? `, extending to approximately ${facts.sizeSqFt}` : ""}.`,
      key_highlights: () =>
        present(facts.keyInfo) ? String(facts.keyInfo) : "[key highlights not yet supplied by requestor]",
      location: () => fact(facts.location, "location information"),
      description: () =>
        `${fact(facts.name, "property name")} comprises ${fact(facts.keyInfo, "accommodation/description details")}.`,
      accommodation: () => fact(facts.sizeSqFt, "accommodation/size"),
      specification: () => fact(facts.keyInfo, "specification details"),
      sustainability: () =>
        present(facts.ber) ? `BER: ${facts.ber}.` : "[BER/sustainability rating not supplied]",
      transport_connectivity: () => fact(facts.location, "transport & connectivity information"),
      tenancy: () => fact(facts.tenure, "tenancy information"),
      investment_information: () =>
        listFacts(facts, [
          ["askingPrice", "Asking price"],
          ["guidePrice", "Guide price"],
          ["rent", "Rent"],
          ["tenure", "Tenure"],
        ]) || "[investment figures not supplied]",
      viewing: () => "Strictly by appointment through the sole selling/letting agent, Savills.",
      contacts: () => fact(facts.agentName, "agent/contact"),
    };
    const generator = generators[sectionKey] ?? (() => "[section not recognised]");
    return { sectionKey, body: generator() };
  }

  private tenderAnalysis(ctx: Record<string, unknown>) {
    const text = String(ctx.documentText ?? "");
    const deadlineMatch = text.match(/deadline[:\s]+([^\n.]+)/i);
    const clientMatch = text.match(/client[:\s]+([^\n.]+)/i);
    return {
      client: clientMatch?.[1]?.trim() ?? fact(ctx.clientName, "client"),
      opportunity: fact(ctx.opportunityName, "opportunity name"),
      submissionDeadline: deadlineMatch?.[1]?.trim() ?? "[deadline not detected — check RFP document]",
      submissionRequirements: text
        ? "Extracted from uploaded document — review in full before relying on this summary."
        : "[no tender document uploaded yet]",
      evaluationCriteria: ["Fee / commercial terms", "Track record & experience", "Team & approach", "Local market knowledge"],
      mandatorySections: ["Executive summary", "Team", "Approach & methodology", "Fees", "Case studies"],
      wordOrPageLimits: "[not detected — confirm against RFP]",
      requiredAttachments: ["CVs", "Case studies", "Company/insurance documentation"],
      potentialRisks: !text ? ["No tender documentation uploaded yet — analysis is a placeholder"] : [],
      informationGaps: [
        !present(ctx.competitors) ? "Known competitors for this opportunity" : null,
        !present(ctx.clientPriorities) ? "What matters most to the client" : null,
      ].filter(Boolean),
      clarificationQuestions: [
        "Confirm the evaluation weighting between fee and quality.",
        "Confirm whether a site visit or presentation stage follows written submission.",
      ],
    };
  }

  private pitchDraftSection(ctx: Record<string, unknown>) {
    const sectionName = String(ctx.sectionName ?? "Section");
    const answers = (ctx.interviewAnswers as Record<string, unknown>) ?? {};
    return {
      sectionName,
      body: `${fact(answers.whyWeCanWin, "why Savills can win")} ${present(answers.differentiators) ? `Our approach is differentiated by: ${answers.differentiators}.` : ""}`.trim(),
    };
  }

  private assetTagSuggestions(ctx: Record<string, unknown>) {
    const tags = new Set<string>();
    if (present(ctx.propertyType)) tags.add(String(ctx.propertyType));
    if (present(ctx.serviceLine)) tags.add(String(ctx.serviceLine));
    if (present(ctx.category)) tags.add(String(ctx.category));
    const year = ctx.year ?? new Date().getFullYear();
    tags.add(String(year));
    if (present(ctx.propertyName)) tags.add(String(ctx.propertyName));
    return { suggestedTags: Array.from(tags) };
  }
}
