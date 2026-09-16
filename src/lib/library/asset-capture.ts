import { db } from "@/lib/db";
import { ai } from "@/lib/ai";

const PHOTO_TAGS = new Set(["hero_image", "additional_photography", "cgi_render", "agent_headshot"]);
const PROPERTY_DOCUMENT_TAGS = new Set(["floorplan", "map"]);

function inferCategory(assetTypeTag: string, requestTypeKey: string): string {
  if (assetTypeTag === "agent_headshot") return "People";
  if (PHOTO_TAGS.has(assetTypeTag)) return "Photography";
  if (assetTypeTag === "brochure") return "Brochures";
  if (PROPERTY_DOCUMENT_TAGS.has(assetTypeTag)) return "Properties";
  if (requestTypeKey === "pitch_tender") return "Pitches";
  if (requestTypeKey === "property_pr" || requestTypeKey === "pr_media" || requestTypeKey === "op_ed") return "PR";
  if (requestTypeKey === "research_report") return "Research";
  if (requestTypeKey === "event_marketing") return "Events";
  if (requestTypeKey === "social_media" || requestTypeKey === "email_campaign") return "Campaigns";
  if (requestTypeKey === "brochure") return "Brochures";
  return "Brand Assets";
}

/**
 * The Marketing Library builds itself from everyday use (spec §21): every
 * file uploaded to a request is automatically promoted into a searchable
 * Asset with inferred category and AI-suggested tags, rather than
 * requiring Marketing to separately populate a DAM.
 */
export async function autoCaptureAsset(fileId: string) {
  const file = await db.file.findUniqueOrThrow({
    where: { id: fileId },
    include: { request: { include: { property: true, client: true, requestType: true, campaign: true } } },
  });

  const category = inferCategory(file.assetTypeTag, file.request?.requestTypeKey ?? "other");

  const tagResult = await ai.generate<{ suggestedTags: string[] }>({
    task: "asset_tag_suggestions",
    context: {
      propertyType: file.request?.property?.propertyType,
      serviceLine: file.request?.property?.serviceLine,
      category,
      propertyName: file.request?.property?.name,
      year: new Date().getFullYear(),
    },
  });

  const asset = await db.asset.create({
    data: {
      fileId: file.id,
      title: file.request?.property?.name ? `${file.request.property.name} — ${file.filename}` : file.filename,
      category,
      confidentiality: file.request?.confidential ? "CONFIDENTIAL" : "STANDARD",
      year: new Date().getFullYear(),
      serviceLine: file.request?.property?.serviceLine,
      propertyId: file.request?.propertyId ?? undefined,
      clientName: file.request?.client?.name,
      campaignId: file.request?.campaignId ?? undefined,
      requestId: file.requestId ?? undefined,
      marketingOwnerId: file.request?.marketingOwnerId ?? undefined,
      tags: { create: tagResult.data.suggestedTags.map((tag) => ({ tag })) },
    },
  });

  return asset;
}
