"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ai } from "@/lib/ai";
import { recordAudit } from "@/lib/audit";
import { IMPORTANT_FACT_KEYS, sectionsForPropertyType, type StoredSection } from "./sections";

export async function createBrochureProject(
  requestId: string,
  input: { propertyType: string; propertyId?: string; manualFacts: Record<string, string> }
) {
  const user = await requireUser();
  const facts: Record<string, string> = { propertyType: input.propertyType, ...input.manualFacts };

  if (input.propertyId) {
    const property = await db.property.findUnique({ where: { id: input.propertyId } });
    if (property) {
      Object.assign(facts, {
        name: property.name,
        address: property.address,
        sizeSqFt: property.sizeSqFt ?? "",
        askingPrice: property.askingPrice ?? "",
        guidePrice: property.guidePrice ?? "",
        rent: property.rent ?? "",
        tenure: property.tenure ?? "",
        ber: property.ber ?? "",
        url: property.url ?? "",
        keyInfo: property.keyInfo ?? "",
        location: property.location ?? "",
        ...input.manualFacts,
      });
    }
  }

  const missingInfo = IMPORTANT_FACT_KEYS.filter((f) => !facts[f.key]?.trim()).map((f) => f.label);
  const sections: StoredSection[] = sectionsForPropertyType(input.propertyType).map((s) => ({ ...s, versions: [] }));

  const project = await db.brochureProject.create({
    data: {
      requestId,
      propertyId: input.propertyId,
      propertyType: input.propertyType,
      suppliedFacts: JSON.stringify(facts),
      missingInfo: JSON.stringify(missingInfo),
      sections: JSON.stringify(sections),
    },
  });

  if (input.propertyId) {
    await db.request.update({ where: { id: requestId }, data: { propertyId: input.propertyId } });
  }

  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "BrochureProject", entityId: project.id, metadata: { stage: "created" } });
  revalidatePath(`/brochure-studio/${requestId}`);
  return project;
}

type GenerateMode = "generate" | "regenerate" | "shorten" | "expand" | "emphasis";

export async function generateSectionContent(brochureProjectId: string, sectionKey: string, mode: GenerateMode) {
  const user = await requireUser();
  const project = await db.brochureProject.findUniqueOrThrow({ where: { id: brochureProjectId } });
  const facts = JSON.parse(project.suppliedFacts) as Record<string, string>;
  const sections = JSON.parse(project.sections) as StoredSection[];
  const section = sections.find((s) => s.key === sectionKey);
  if (!section) throw new Error("Unknown section");

  let body: string;
  if (mode === "shorten") {
    const latest = section.versions[section.versions.length - 1]?.body ?? "";
    const sentences = latest.split(/(?<=[.!?])\s+/);
    body = sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(" ");
  } else if (mode === "expand") {
    const latest = section.versions[section.versions.length - 1]?.body ?? "";
    const result = await ai.generate<{ sectionKey: string; body: string }>({ task: "brochure_section", context: { sectionKey, facts } });
    body = latest && !result.data.body.includes(latest) ? `${latest} ${result.data.body}` : result.data.body;
  } else {
    const result = await ai.generate<{ sectionKey: string; body: string }>({ task: "brochure_section", context: { sectionKey, facts } });
    body = result.data.body;
  }

  section.versions.push({ body, generatedByAI: true, createdAt: new Date().toISOString() });

  await db.brochureProject.update({ where: { id: brochureProjectId }, data: { sections: JSON.stringify(sections) } });
  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "BrochureProject", entityId: brochureProjectId, metadata: { sectionKey, mode } });
  revalidatePath(`/brochure-studio/${project.requestId}`);
  return section.versions[section.versions.length - 1];
}

export async function saveSectionEdit(brochureProjectId: string, sectionKey: string, body: string) {
  const user = await requireUser();
  const project = await db.brochureProject.findUniqueOrThrow({ where: { id: brochureProjectId } });
  const sections = JSON.parse(project.sections) as StoredSection[];
  const section = sections.find((s) => s.key === sectionKey);
  if (!section) throw new Error("Unknown section");

  section.versions.push({ body, generatedByAI: false, createdAt: new Date().toISOString() });
  await db.brochureProject.update({ where: { id: brochureProjectId }, data: { sections: JSON.stringify(sections) } });
  await recordAudit({ actorId: user.id, action: "content.generated", entityType: "BrochureProject", entityId: brochureProjectId, metadata: { sectionKey, mode: "manual_edit" } });
  revalidatePath(`/brochure-studio/${project.requestId}`);
}
