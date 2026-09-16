"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ai } from "@/lib/ai";
import { recordAudit } from "@/lib/audit";

const DEFAULT_STRUCTURE = ["Executive Summary", "Understanding the Brief", "Our Team", "Track Record", "Approach & Methodology", "Fees"];

export interface TenderAnalysisResult {
  client: string;
  opportunity: string;
  submissionDeadline: string;
  submissionRequirements: string;
  evaluationCriteria: string[];
  mandatorySections: string[];
  wordOrPageLimits: string;
  requiredAttachments: string[];
  potentialRisks: string[];
  informationGaps: string[];
  clarificationQuestions: string[];
}

export async function analyzeTender(
  requestId: string,
  input: { clientName: string; opportunityName: string; documentText: string; submissionDeadline?: string }
) {
  const user = await requireUser();

  const result = await ai.generate<TenderAnalysisResult>({
    task: "tender_analysis",
    context: { clientName: input.clientName, opportunityName: input.opportunityName, documentText: input.documentText },
  });

  const project = await db.pitchProject.create({
    data: {
      requestId,
      clientName: input.clientName,
      opportunityName: input.opportunityName,
      submissionDeadline: input.submissionDeadline ? new Date(input.submissionDeadline) : undefined,
      analysis: JSON.stringify(result.data),
    },
  });

  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "PitchProject", entityId: project.id, metadata: { stage: "tender_analysis" } });
  revalidatePath(`/pitch-studio/${requestId}`);
  return project;
}

export async function saveInterviewAnswers(pitchProjectId: string, answers: Record<string, string>) {
  const user = await requireUser();
  const project = await db.pitchProject.update({ where: { id: pitchProjectId }, data: { interviewAnswers: JSON.stringify(answers) } });
  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "PitchProject", entityId: pitchProjectId, metadata: { stage: "interview" } });
  revalidatePath(`/pitch-studio/${project.requestId}`);
}

export async function generateStructure(pitchProjectId: string) {
  const user = await requireUser();
  const project = await db.pitchProject.findUniqueOrThrow({ where: { id: pitchProjectId } });
  const analysis = JSON.parse(project.analysis) as Partial<TenderAnalysisResult>;
  const structure = analysis.mandatorySections?.length ? analysis.mandatorySections : DEFAULT_STRUCTURE;

  await db.pitchProject.update({ where: { id: pitchProjectId }, data: { structure: JSON.stringify(structure) } });
  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "PitchProject", entityId: pitchProjectId, metadata: { stage: "structure" } });
  revalidatePath(`/pitch-studio/${project.requestId}`);
}

export async function generateDraftSection(pitchProjectId: string, sectionName: string) {
  const user = await requireUser();
  const project = await db.pitchProject.findUniqueOrThrow({ where: { id: pitchProjectId } });
  const interviewAnswers = JSON.parse(project.interviewAnswers) as Record<string, string>;
  const draftContent = JSON.parse(project.draftContent) as Record<string, string>;

  const result = await ai.generate<{ sectionName: string; body: string }>({
    task: "pitch_draft_section",
    context: { sectionName, interviewAnswers },
  });
  draftContent[sectionName] = result.data.body;

  await db.pitchProject.update({ where: { id: pitchProjectId }, data: { draftContent: JSON.stringify(draftContent) } });
  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "PitchProject", entityId: pitchProjectId, metadata: { stage: "draft", sectionName } });
  revalidatePath(`/pitch-studio/${project.requestId}`);
  return result.data.body;
}

export async function generateFullDraft(pitchProjectId: string) {
  const project = await db.pitchProject.findUniqueOrThrow({ where: { id: pitchProjectId } });
  const structure = JSON.parse(project.structure) as string[];
  for (const section of structure) {
    await generateDraftSection(pitchProjectId, section);
  }
}

export async function saveDraftSection(pitchProjectId: string, sectionName: string, body: string) {
  const user = await requireUser();
  const project = await db.pitchProject.findUniqueOrThrow({ where: { id: pitchProjectId } });
  const draftContent = JSON.parse(project.draftContent) as Record<string, string>;
  draftContent[sectionName] = body;
  await db.pitchProject.update({ where: { id: pitchProjectId }, data: { draftContent: JSON.stringify(draftContent) } });
  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "PitchProject", entityId: pitchProjectId, metadata: { stage: "manual_edit", sectionName } });
  revalidatePath(`/pitch-studio/${project.requestId}`);
}
