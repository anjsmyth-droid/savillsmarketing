/* eslint-disable no-console */
import {
  PrismaClient,
  type RequestPriority,
  type RequestStatus,
} from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const db = new PrismaClient();
const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
const daysAgo = (n: number) => daysFromNow(-n);

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function placeholderSvg(label: string, sublabel: string, bg: string): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <rect width="900" height="600" fill="${bg}"/>
  <rect width="900" height="600" fill="#000000" opacity="0.12"/>
  <text x="50%" y="46%" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="36" fill="#ffffff">${escapeXml(label)}</text>
  <text x="50%" y="56%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" letter-spacing="2" fill="#ffffffcc">${escapeXml(sublabel.toUpperCase())}</text>
</svg>`;
  return Buffer.from(svg, "utf-8");
}

let seq = 0;
async function saveDummyFile(kind: "svg" | "txt", label: string, sublabel: string, bg: string, textBody?: string) {
  await mkdir(UPLOAD_ROOT, { recursive: true });
  seq += 1;
  const storageKey = `seed-${seq}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${kind}`;
  const buffer =
    kind === "svg" ? placeholderSvg(label, sublabel, bg) : Buffer.from(textBody ?? `${label}\n\n${sublabel}`, "utf-8");
  await writeFile(path.join(UPLOAD_ROOT, storageKey), buffer);
  return { storageKey, size: buffer.byteLength };
}

const PALETTE = ["#16332c", "#3d6b4c", "#33566e", "#a9824c", "#6b4f2a", "#5b6b5f", "#2f4a52"];
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

async function main() {
  console.log("Seeding Marketing Hub dummy data…");

  // ---------------------------------------------------------------------
  // Departments
  // ---------------------------------------------------------------------
  const deptDefs = [
    { name: "Marketing", isMarketingTeam: true },
    { name: "Creative Services", isMarketingTeam: true, isCreativeTeam: true },
    { name: "Residential", isMarketingTeam: false },
    { name: "Commercial (Office Agency)", isMarketingTeam: false },
    { name: "Industrial & Logistics", isMarketingTeam: false },
    { name: "Retail", isMarketingTeam: false },
    { name: "Capital Markets & Investment", isMarketingTeam: false },
    { name: "New Homes", isMarketingTeam: false },
    { name: "Research", isMarketingTeam: false },
  ];
  const depts: Record<string, string> = {};
  for (const d of deptDefs) {
    const rec = await db.department.create({ data: d });
    depts[d.name] = rec.id;
  }

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------
  const userDefs = [
    { key: "andrew", name: "Andrew Smyth", email: "andrew.smyth@savills.ie", role: "MARKETING_ADMIN", dept: "Marketing", jobTitle: "Head of Marketing & Communications", initials: "AS", color: PALETTE[0] },
    { key: "cian", name: "Cian Doyle", email: "cian.doyle@savills.ie", role: "MARKETING", dept: "Marketing", jobTitle: "PR & Communications Manager", initials: "CD", color: PALETTE[1] },
    { key: "niamh", name: "Niamh Kelly", email: "niamh.kelly@savills.ie", role: "MARKETING", dept: "Marketing", jobTitle: "Digital Marketing Executive", initials: "NK", color: PALETTE[2] },
    { key: "roisin", name: "Roisin Malone", email: "roisin.malone@savills.ie", role: "MARKETING", dept: "Marketing", jobTitle: "Events & Sponsorship Manager", initials: "RM", color: PALETTE[3] },
    { key: "sean", name: "Sean Whelan", email: "sean.whelan@savills.ie", role: "MARKETING", dept: "Creative Services", jobTitle: "Senior Designer", initials: "SW", color: PALETTE[4] },
    { key: "aoife", name: "Aoife Ryan", email: "aoife.ryan@savills.ie", role: "MARKETING", dept: "Creative Services", jobTitle: "Designer & Videographer", initials: "AR", color: PALETTE[5] },
    { key: "oisin", name: "Oisín Farrell", email: "oisin.farrell@savills.ie", role: "STANDARD", dept: "Residential", jobTitle: "Senior Negotiator", initials: "OF", color: PALETTE[6] },
    { key: "grainne", name: "Gráinne Nolan", email: "grainne.nolan@savills.ie", role: "STANDARD", dept: "Commercial (Office Agency)", jobTitle: "Director, Office Agency", initials: "GN", color: PALETTE[0] },
    { key: "padraig", name: "Pádraig Costello", email: "padraig.costello@savills.ie", role: "STANDARD", dept: "Industrial & Logistics", jobTitle: "Director", initials: "PC", color: PALETTE[1] },
    { key: "tom", name: "Tom Fitzgerald", email: "tom.fitzgerald@savills.ie", role: "STANDARD", dept: "New Homes", jobTitle: "New Homes Director", initials: "TF", color: PALETTE[2] },
    { key: "emer", name: "Emer Molloy", email: "emer.molloy@savills.ie", role: "STANDARD", dept: "Research", jobTitle: "Research Analyst", initials: "EM", color: PALETTE[3] },
    { key: "fiona", name: "Fiona Lynch", email: "fiona.lynch@savills.ie", role: "DIVISIONAL", dept: "Capital Markets & Investment", jobTitle: "Director, Capital Markets", initials: "FL", color: PALETTE[4] },
    { key: "barry", name: "Barry Hughes", email: "barry.hughes@savills.ie", role: "DIVISIONAL", dept: "Retail", jobTitle: "Head of Retail", initials: "BH", color: PALETTE[5] },
  ] as const;

  const users: Record<string, { id: string }> = {};
  for (const u of userDefs) {
    const rec = await db.user.create({
      data: {
        name: u.name,
        email: u.email,
        role: u.role as never,
        departmentId: depts[u.dept],
        jobTitle: u.jobTitle,
        initials: u.initials,
        avatarColor: u.color,
      },
    });
    users[u.key] = rec;
  }

  // ---------------------------------------------------------------------
  // Reference / lookup data
  // ---------------------------------------------------------------------
  const requestTypes = [
    { key: "property_pr", label: "Property PR / Editorial", description: "Press coverage or editorial for an instruction, launch, sale or letting.", icon: "Building2", category: "PR", sortOrder: 1 },
    { key: "pr_media", label: "PR / Media", description: "General media relations, press enquiries and media approaches.", icon: "Megaphone", category: "PR", sortOrder: 2 },
    { key: "op_ed", label: "Op-ed / Thought Leadership", description: "Develop and place a byline or opinion piece.", icon: "PenLine", category: "Content", sortOrder: 3 },
    { key: "social_media", label: "Social Media", description: "Organic or paid social content and campaigns.", icon: "Share2", category: "Digital", sortOrder: 4 },
    { key: "email_campaign", label: "Email / E-campaign", description: "Email marketing and e-campaigns to a target audience.", icon: "Mail", category: "Digital", sortOrder: 5 },
    { key: "brochure", label: "Brochure", description: "Property or corporate brochure production.", icon: "BookOpen", category: "Creative", sortOrder: 6 },
    { key: "pitch_tender", label: "Pitch / Tender", description: "New business pitch or tender submission support.", icon: "Trophy", category: "Business Development", sortOrder: 7 },
    { key: "event_marketing", label: "Event Marketing", description: "Plan and promote an event, launch or sponsorship activation.", icon: "CalendarClock", category: "Events", sortOrder: 8 },
    { key: "research_report", label: "Research / Report Launch", description: "Launch a research report or market commentary.", icon: "LineChart", category: "Content", sortOrder: 9 },
    { key: "internal_comms", label: "Internal Communications", description: "Staff-facing communications and announcements.", icon: "Users", category: "Internal", sortOrder: 10 },
    { key: "creative_design", label: "Creative / Design", description: "Design support for print or digital deliverables.", icon: "Palette", category: "Creative", sortOrder: 11 },
    { key: "other", label: "Other Marketing Request", description: "Anything else Marketing can help with.", icon: "HelpCircle", category: "General", sortOrder: 12 },
  ];
  for (const rt of requestTypes) await db.requestTypeDefinition.create({ data: rt });

  const serviceLines = [
    "Office Agency", "Industrial & Logistics", "Retail", "Capital Markets & Investment",
    "Development Land", "Hotels", "Residential", "New Homes", "Country Residential",
    "Research", "Property Management", "Valuations",
  ];
  for (const name of serviceLines) await db.serviceLine.create({ data: { name } });

  const mediaOutlets: { name: string; category: string }[] = [
    ...["The Irish Times", "Irish Independent", "Business Post", "Irish Examiner", "RTÉ", "Other"].map((name) => ({ name, category: "National" })),
    ...["Property Week", "React News", "CoStar", "Bisnow", "Other"].map((name) => ({ name, category: "Property / Trade" })),
    ...["Television", "National Radio", "Dublin Radio", "Regional Radio"].map((name) => ({ name, category: "Broadcast" })),
    ...["Cork Evening Echo", "Galway Advertiser", "Limerick Leader", "Other"].map((name) => ({ name, category: "Regional" })),
  ];
  for (const m of mediaOutlets) await db.mediaOutlet.create({ data: m });

  const assetTypes = ["Hero Image", "Additional Photography", "CGI / Render", "Brochure", "Floorplan", "Map", "Agent Headshot", "Existing Copy", "Technical Document", "Other"];
  for (const name of assetTypes) await db.assetTypeDefinition.create({ data: { name } });

  const knowledgeDocs = [
    { title: "Brand Guidelines Overview", category: "brand_guidelines", body: "Savills Ireland brand guidelines: use the primary logo lock-up on white or light backgrounds; maintain minimum clear space; primary palette is deep green and warm neutrals; headline typeface is a serif display, body copy is a clean sans-serif.", tags: "brand,logo,colour" },
    { title: "Tone of Voice", category: "tone_of_voice", body: "Professional, informed, clear and measured. Commercially aware without exaggeration. Avoid generic corporate buzzwords and unnecessary superlatives. Prefer concrete facts and figures to adjectives.", tags: "tone,voice,writing" },
    { title: "Approved Terminology", category: "terminology", body: "Always refer to the company as 'Savills'. Never write \"Savills'\". Treat Savills as singular: 'Savills is', never 'Savills are'. Use British/Irish English spelling throughout (e.g. 'organised', not 'organized').", tags: "terminology,grammar,house-style" },
    { title: "Company Boilerplate", category: "boilerplate", body: "Savills is a leading global real estate services provider listed on the London Stock Exchange. Savills Ireland has been operating since 2006 and provides a full range of advisory, transactional and management services across all real estate sectors.", tags: "boilerplate,about" },
    { title: "Approved Market Statistics — H1 2026", category: "statistics", body: "Irish investment volumes reached €1.6bn in H1 2026 (Savills Research). Prime Dublin office yields stand at 5.25%. Industrial & logistics take-up in Dublin totalled 1.1m sq ft in H1 2026.", tags: "statistics,research,market-data" },
    { title: "Standard Media Disclaimer", category: "disclaimer", body: "This document has been prepared by Savills Ireland for general informative purposes only. It does not constitute advice and should not be relied upon as such.", tags: "disclaimer,legal" },
    { title: "Example Press Release — Investment Sale", category: "example_release", body: "DUBLIN, [DATE] — Savills Ireland has completed the sale of [property] on behalf of [vendor] to [purchaser] for approximately €[price]. The [size] asset is let to [tenant] and reflects a net initial yield of [yield]%. [Spokesperson], [title] at Savills, said: \"[quote].\"", tags: "example,press-release,investment" },
    { title: "Example Brochure Copy — Office Investment", category: "example_brochure", body: "Overview: A rare opportunity to acquire a landmark office investment in Dublin's core CBD. Location: Positioned within a five-minute walk of two DART stations. Investment Summary: Let to a strong covenant on a long lease with fixed uplifts.", tags: "example,brochure,office" },
    { title: "Example Pitch Executive Summary", category: "example_pitch", body: "Savills is uniquely placed to deliver this instruction, combining local market intelligence with an in-house marketing and research capability recognised as market-leading in Ireland.", tags: "example,pitch" },
    { title: "Approved Biography — Andrew Smyth", category: "biography", body: "Andrew Smyth is Head of Marketing & Communications at Savills Ireland, where he has built the largest full-service in-house real estate marketing team in the Irish market since joining in 2013.", tags: "biography,marketing" },
    { title: "Standard Service Description — Office Agency", category: "service_description", body: "Savills' Office Agency team advises landlords, tenants and investors across Dublin and regional office markets, from initial strategy through to lease completion.", tags: "service-description,office" },
  ];
  for (const k of knowledgeDocs) await db.knowledgeDocument.create({ data: k });

  // ---------------------------------------------------------------------
  // Clients, Properties, Campaigns
  // ---------------------------------------------------------------------
  const clientDefs = [
    { key: "oakwood", name: "Oakwood Developments", type: "Developer" },
    { key: "kildareRetail", name: "Kildare Retail Partners", type: "Landlord" },
    { key: "anchorLogistics", name: "Anchor Logistics Ltd", type: "Tenant" },
    { key: "riversideCapital", name: "Riverside Capital", type: "Investor" },
    { key: "componentLtd", name: "Component Ltd", type: "Tenant" },
    { key: "confidentialVendor", name: "Confidential Private Vendor", type: "Vendor", sensitive: true },
  ];
  const clients: Record<string, string> = {};
  for (const c of clientDefs) {
    const rec = await db.client.create({ data: { name: c.name, type: c.type, sensitive: !!c.sensitive } });
    clients[c.key] = rec.id;
  }

  const propertyDefs = [
    { key: "oneNorthDock", name: "One North Dock", address: "North Dock, Dublin 1", propertyType: "Office", serviceLine: "Office Agency", tenure: "Freehold", sizeSqFt: "112,000 sq ft", askingPrice: "€68,000,000", ber: "A3", dept: "Commercial (Office Agency)", client: "riversideCapital", url: "https://savills.ie/properties/one-north-dock" },
    { key: "ballymountLogistics", name: "Ballymount Logistics Park, Unit 4", address: "Ballymount, Dublin 12", propertyType: "Industrial & Logistics", serviceLine: "Industrial & Logistics", tenure: "Leasehold", sizeSqFt: "48,500 sq ft", rent: "€425,000 per annum", ber: "B1", dept: "Industrial & Logistics", client: "anchorLogistics" },
    { key: "graftonStreetUnit", name: "24 Grafton Street", address: "Grafton Street, Dublin 2", propertyType: "Retail", serviceLine: "Retail", tenure: "Leasehold", sizeSqFt: "3,200 sq ft", rent: "€310,000 per annum", dept: "Retail", client: "kildareRetail" },
    { key: "corkMixedUse", name: "Quayside Cork", address: "Lapp's Quay, Cork", propertyType: "Investment", serviceLine: "Capital Markets & Investment", tenure: "Freehold", sizeSqFt: "64,000 sq ft", guidePrice: "€24,500,000", dept: "Capital Markets & Investment", client: "riversideCapital" },
    { key: "lucanLand", name: "Lucan Strategic Land", address: "Lucan, Co. Dublin", propertyType: "Development Land", serviceLine: "Development Land", tenure: "Freehold", sizeSqFt: "18.4 acres", guidePrice: "Guide on application", dept: "New Homes", client: "oakwood" },
    { key: "southDublinHouse", name: "14 Elm Grove", address: "Dundrum, Dublin 14", propertyType: "Residential", serviceLine: "Residential", tenure: "Freehold", sizeSqFt: "2,150 sq ft", askingPrice: "€1,150,000", ber: "C1", dept: "Residential" },
    { key: "ashgroveNewHomes", name: "Ashgrove, Maynooth", address: "Maynooth, Co. Kildare", propertyType: "New Homes", serviceLine: "New Homes", tenure: "Freehold", sizeSqFt: "3 & 4 bed homes", askingPrice: "From €425,000", ber: "A2", dept: "New Homes", client: "oakwood" },
    { key: "wicklowHouse", name: "Glenview House", address: "Roundwood, Co. Wicklow", propertyType: "Country Residential", serviceLine: "Country Residential", tenure: "Freehold", sizeSqFt: "5,400 sq ft on 12 acres", guidePrice: "€2,650,000", dept: "Residential" },
    { key: "sandyfordOffice", name: "Beacon Quarter, Block C", address: "Sandyford, Dublin 18", propertyType: "Office", serviceLine: "Office Agency", tenure: "Leasehold", sizeSqFt: "22,000 sq ft", rent: "On application", dept: "Commercial (Office Agency)", client: "componentLtd" },
  ];
  const properties: Record<string, string> = {};
  for (const p of propertyDefs) {
    const rec = await db.property.create({
      data: {
        name: p.name,
        address: p.address,
        propertyType: p.propertyType,
        serviceLine: p.serviceLine,
        tenure: p.tenure,
        sizeSqFt: p.sizeSqFt,
        askingPrice: p.askingPrice,
        guidePrice: p.guidePrice,
        rent: p.rent,
        ber: p.ber,
        url: p.url,
        departmentId: depts[p.dept],
        clientId: p.client ? clients[p.client] : undefined,
      },
    });
    properties[p.key] = rec.id;
  }

  const campaignDefs = [
    { key: "prsAmenities", name: "PRS Amenities Campaign", type: "PR", owner: "roisin" },
    { key: "twentyYears", name: "Savills Ireland — 20 Years", type: "Corporate", owner: "andrew" },
    { key: "investmentOutlook", name: "Q3 Investment Outlook Launch", type: "Research", owner: "cian" },
    { key: "newHomesSpring", name: "New Homes Spring Launch", type: "Property Launch", owner: "niamh" },
    { key: "esgSeries", name: "ESG in Real Estate Series", type: "Thought Leadership", owner: "cian" },
  ] as const;
  const campaigns: Record<string, string> = {};
  for (const c of campaignDefs) {
    const rec = await db.campaign.create({ data: { name: c.name, type: c.type, ownerId: users[c.owner].id, status: "Active" } });
    campaigns[c.key] = rec.id;
  }

  // ---------------------------------------------------------------------
  // Requests
  // ---------------------------------------------------------------------
  type ReqSpec = {
    title: string;
    typeKey: string;
    requestor: keyof typeof users;
    owner?: keyof typeof users;
    creativeOwner?: keyof typeof users;
    status: RequestStatus;
    priority: RequestPriority;
    confidential?: boolean;
    property?: keyof typeof properties;
    client?: keyof typeof clients;
    campaign?: keyof typeof campaigns;
    createdAgo: number;
    dueIn: number;
    formData: Record<string, unknown>;
  };

  const specs: ReqSpec[] = [
    { title: "One North Dock — bringing to market", typeKey: "property_pr", requestor: "grainne", owner: "cian", status: "COMPLETE", priority: "IMPORTANT", property: "oneNorthDock", client: "riversideCapital", createdAgo: 45, dueIn: -20, formData: { whatsHappening: "New instruction — property for sale", propertyType: "Office", propertyName: "One North Dock", sellingPoints: "Landmark Dublin 1 office investment, A3 BER, fully let to strong covenants", marketContext: "Follows a strong H1 2026 for Dublin office investment", quoteRequired: true, quotePerson: "Fiona Lynch", pressReleaseRequired: true, editorialRequired: true, launchDate: daysAgo(20).toISOString(), targetMedia: ["The Irish Times", "Business Post", "React News"] } },
    { title: "Ballymount Logistics — new letting announcement", typeKey: "property_pr", requestor: "padraig", owner: "cian", status: "AWAITING_REQUESTOR", priority: "NORMAL", property: "ballymountLogistics", client: "anchorLogistics", createdAgo: 6, dueIn: 5, formData: { whatsHappening: "Transaction completed — letting to Anchor Logistics", propertyType: "Industrial & Logistics", propertyName: "Ballymount Logistics Park, Unit 4", sellingPoints: "Prime Dublin 12 logistics unit, strong occupier demand", quoteRequired: true, pressReleaseRequired: true, targetMedia: ["React News", "CoStar"] } },
    { title: "24 Grafton Street — new retail letting", typeKey: "property_pr", requestor: "barry", owner: "cian", status: "IN_PROGRESS", priority: "NORMAL", property: "graftonStreetUnit", client: "kildareRetail", createdAgo: 9, dueIn: 6, formData: { whatsHappening: "Property to let", propertyType: "Retail", propertyName: "24 Grafton Street", sellingPoints: "Prime Grafton Street pitch, footfall recovery post-2025", quoteRequired: false, pressReleaseRequired: false, editorialRequired: true } },
    { title: "Quayside Cork — investment sale launch", typeKey: "property_pr", requestor: "fiona", owner: "andrew", status: "BRIEF_REVIEW", priority: "URGENT", property: "corkMixedUse", client: "riversideCapital", createdAgo: 2, dueIn: 10, confidential: true, formData: { whatsHappening: "Investment opportunity", propertyType: "Investment", propertyName: "Quayside Cork", sellingPoints: "Rare Cork mixed-use investment opportunity", sensitivities: "Vendor identity confidential until launch", pressReleaseRequired: true } },
    { title: "Glenview House, Roundwood — country residential launch", typeKey: "property_pr", requestor: "oisin", owner: "niamh", status: "SUBMITTED", priority: "NORMAL", property: "wicklowHouse", createdAgo: 1, dueIn: 14, formData: { whatsHappening: "New instruction — property for sale", propertyType: "Country Residential", propertyName: "Glenview House", sellingPoints: "12 acres, equestrian facilities, mountain views" } },
    { title: "Ashgrove Maynooth — Phase 2 launch", typeKey: "property_pr", requestor: "tom", owner: "roisin", status: "SCHEDULED", priority: "IMPORTANT", property: "ashgroveNewHomes", client: "oakwood", campaign: "newHomesSpring", createdAgo: 15, dueIn: 4, formData: { whatsHappening: "Development launch", propertyType: "New Homes", propertyName: "Ashgrove, Maynooth", sellingPoints: "A2-rated homes, Maynooth commuter belt, Help to Buy eligible", launchDate: daysFromNow(4).toISOString() } },

    { title: "Q3 industrial market commentary — media approach", typeKey: "pr_media", requestor: "padraig", owner: "cian", status: "IN_PROGRESS", priority: "NORMAL", campaign: "investmentOutlook", createdAgo: 5, dueIn: 7, formData: { subject: "Q3 industrial & logistics take-up", angle: "Take-up up 12% year on year", spokesperson: "Pádraig Costello" } },
    { title: "Journalist enquiry — Dublin office vacancy rates", typeKey: "pr_media", requestor: "grainne", owner: "cian", status: "DRAFT_READY", priority: "URGENT", createdAgo: 1, dueIn: 1, formData: { subject: "Dublin office vacancy", angle: "Reactive comment for Business Post", spokesperson: "Gráinne Nolan" } },

    { title: "Help to Buy reform — op-ed for the Irish Times", typeKey: "op_ed", requestor: "tom", owner: "andrew", status: "IN_PROGRESS", priority: "NORMAL", campaign: "newHomesSpring", createdAgo: 8, dueIn: 12, formData: { idea: "Help to Buy needs recalibration for regional price growth", mainArgument: "The scheme's price ceiling no longer reflects regional new-build costs", audience: "Policy makers, prospective buyers", evidence: "Savills Research new homes pricing data 2026", targetPublication: "The Irish Times", hasDraft: false } },
    { title: "ESG credentials in occupier decisions", typeKey: "op_ed", requestor: "fiona", owner: "cian", status: "DRAFT_READY", priority: "NORMAL", campaign: "esgSeries", createdAgo: 14, dueIn: -2, formData: { idea: "ESG is now a leasing decision, not a reporting exercise", mainArgument: "Occupiers are screening buildings on ESG credentials before shortlisting", audience: "Corporate occupiers, landlords", evidence: "Internal occupier survey", targetPublication: "Business Post", hasDraft: true } },

    { title: "Ashgrove — Instagram launch content", typeKey: "social_media", requestor: "tom", owner: "niamh", status: "IN_PROGRESS", priority: "NORMAL", property: "ashgroveNewHomes", campaign: "newHomesSpring", createdAgo: 4, dueIn: 3, formData: { objective: "Drive registrations of interest", platform: "Instagram", audience: "First-time buyers, Maynooth commuter belt", message: "Phase 2 now selling at Ashgrove, Maynooth", paidPromotion: true } },
    { title: "PRS amenities — LinkedIn thought leadership post", typeKey: "social_media", requestor: "roisin", owner: "niamh", status: "AWAITING_APPROVAL", priority: "NORMAL", campaign: "prsAmenities", createdAgo: 6, dueIn: 1, formData: { objective: "Position Savills as PRS amenities experts", platform: "LinkedIn", audience: "Institutional investors", message: "What tenants really want from amenity-led PRS schemes", paidPromotion: false } },
    { title: "24 Grafton Street — social teaser", typeKey: "social_media", requestor: "barry", owner: "niamh", status: "SUBMITTED", priority: "NORMAL", property: "graftonStreetUnit", createdAgo: 1, dueIn: 6, formData: { objective: "Generate occupier interest", platform: "LinkedIn", audience: "Retail occupiers", message: "Prime Grafton Street unit now available to let" } },

    { title: "Investment Outlook report — subscriber e-campaign", typeKey: "email_campaign", requestor: "emer", owner: "cian", status: "SCHEDULED", priority: "IMPORTANT", campaign: "investmentOutlook", createdAgo: 10, dueIn: 3, formData: { campaignName: "Q3 Investment Outlook", objective: "Drive report downloads", audience: "Research subscriber list", subject: "Irish investment volumes reach €1.6bn — read the Q3 Outlook", callToAction: "Download the report" } },
    { title: "New Homes Spring Launch — buyer database send", typeKey: "email_campaign", requestor: "tom", owner: "niamh", status: "BRIEF_REVIEW", priority: "NORMAL", campaign: "newHomesSpring", createdAgo: 2, dueIn: 9, formData: { campaignName: "New Homes Spring Launch", objective: "Announce Ashgrove Phase 2", audience: "New Homes buyer database", callToAction: "Register interest" } },

    { title: "One North Dock — investment brochure", typeKey: "brochure", requestor: "grainne", owner: "sean", status: "IN_PROGRESS", priority: "IMPORTANT", property: "oneNorthDock", client: "riversideCapital", createdAgo: 20, dueIn: 5, formData: { notes: "Full investment brochure, digital + print" } },
    { title: "Quayside Cork — teaser brochure", typeKey: "brochure", requestor: "fiona", owner: "sean", status: "BRIEF_REVIEW", priority: "URGENT", property: "corkMixedUse", client: "riversideCapital", confidential: true, createdAgo: 2, dueIn: 8, formData: { notes: "Confidential teaser ahead of full launch" } },
    { title: "Glenview House — country residential brochure", typeKey: "brochure", requestor: "oisin", owner: "aoife", status: "DRAFT_READY", priority: "NORMAL", property: "wicklowHouse", createdAgo: 12, dueIn: -1, formData: { notes: "Premium print brochure for country residential launch" } },

    { title: "Logistics portfolio — pitch for Anchor Logistics", typeKey: "pitch_tender", requestor: "padraig", owner: "andrew", status: "IN_PROGRESS", priority: "URGENT", client: "anchorLogistics", confidential: true, createdAgo: 5, dueIn: 4, formData: { notes: "Competitive pitch for national logistics portfolio instruction" } },
    { title: "Local authority framework — property advisory tender", typeKey: "pitch_tender", requestor: "fiona", owner: "andrew", status: "SUBMITTED", priority: "IMPORTANT", confidential: true, createdAgo: 1, dueIn: 21, formData: { notes: "Multi-year advisory framework tender" } },

    { title: "Ashgrove Phase 2 — launch event", typeKey: "event_marketing", requestor: "tom", owner: "roisin", status: "IN_PROGRESS", priority: "IMPORTANT", property: "ashgroveNewHomes", campaign: "newHomesSpring", createdAgo: 9, dueIn: 5, formData: { eventName: "Ashgrove Phase 2 Launch", venue: "On-site show house, Maynooth", audience: "Prospective buyers, brokers", expectedAttendance: "150", format: "In-person open evening", prRequired: true, socialRequired: true } },
    { title: "Savills Chase — client hospitality", typeKey: "event_marketing", requestor: "barry", owner: "roisin", status: "AWAITING_REQUESTOR", priority: "NORMAL", createdAgo: 18, dueIn: 30, formData: { eventName: "Savills Chase Hospitality", venue: "Leopardstown Racecourse", audience: "Key retail clients", expectedAttendance: "60", format: "Corporate hospitality" } },

    { title: "Q3 Investment Outlook — report launch", typeKey: "research_report", requestor: "emer", owner: "cian", status: "SCHEDULED", priority: "IMPORTANT", campaign: "investmentOutlook", createdAgo: 11, dueIn: 3, formData: { reportTitle: "Q3 2026 Investment Outlook", topic: "Irish commercial investment market", keyFindings: "Volumes up 18% quarter on quarter", targetAudience: "Institutional investors, media" } },
    { title: "New Homes pricing index — quarterly update", typeKey: "research_report", requestor: "emer", owner: "andrew", status: "DRAFT_READY", priority: "NORMAL", createdAgo: 13, dueIn: -3, formData: { reportTitle: "New Homes Pricing Index Q3", topic: "New homes pricing trends", keyFindings: "Regional price growth outpacing Dublin" } },

    { title: "20 Years of Savills Ireland — staff announcement", typeKey: "internal_comms", requestor: "andrew", owner: "niamh", status: "IN_PROGRESS", priority: "NORMAL", campaign: "twentyYears", createdAgo: 7, dueIn: 20, formData: { topic: "20th anniversary celebrations", audience: "All staff", channel: "All-staff email + intranet", keyMessages: "Thank you to the team; look ahead to anniversary events" } },

    { title: "New Homes team — pitch deck refresh", typeKey: "creative_design", requestor: "tom", owner: "sean", status: "AWAITING_REQUESTOR", priority: "NORMAL", createdAgo: 8, dueIn: 4, formData: { projectType: "Presentation", deliverable: "PowerPoint pitch deck template", objective: "Refresh New Homes new-instruction pitch deck", printOrDigital: "Digital" } },
    { title: "Office Agency — exhibition stand graphics", typeKey: "creative_design", requestor: "grainne", owner: "aoife", status: "COMPLETE", priority: "NORMAL", createdAgo: 40, dueIn: -25, formData: { projectType: "Print", deliverable: "3m x 2m exhibition stand", objective: "SCSI Property Conference stand", printOrDigital: "Print", quantity: "1" } },

    { title: "Vacant property incentive commentary — general enquiry", typeKey: "other", requestor: "emer", owner: "cian", status: "DRAFT", priority: "NORMAL", createdAgo: 0, dueIn: 10, formData: { description: "Draft commentary on vacant property tax incentives for internal use" } },
  ];

  const createdRequests: Record<string, { id: string; spec: ReqSpec }> = {};

  for (const spec of specs) {
    const submittedStatuses: RequestStatus[] = ["SUBMITTED", "BRIEF_REVIEW", "IN_PROGRESS", "DRAFT_READY", "AWAITING_REQUESTOR", "AWAITING_APPROVAL", "SCHEDULED", "COMPLETE"];
    const isSubmitted = submittedStatuses.includes(spec.status);

    const request = await db.request.create({
      data: {
        title: spec.title,
        requestTypeKey: spec.typeKey,
        status: spec.status,
        priority: spec.priority,
        confidential: !!spec.confidential,
        requestorId: users[spec.requestor].id,
        marketingOwnerId: spec.owner ? users[spec.owner].id : undefined,
        creativeOwnerId: spec.creativeOwner ? users[spec.creativeOwner].id : undefined,
        propertyId: spec.property ? properties[spec.property] : undefined,
        clientId: spec.client ? clients[spec.client] : undefined,
        campaignId: spec.campaign ? campaigns[spec.campaign] : undefined,
        formData: JSON.stringify(spec.formData),
        requestedDueDate: daysFromNow(spec.dueIn),
        targetDate: daysFromNow(spec.dueIn),
        submittedAt: isSubmitted ? daysAgo(spec.createdAgo) : null,
        completedAt: spec.status === "COMPLETE" ? daysAgo(Math.max(spec.createdAgo - 10, 1)) : null,
        createdAt: daysAgo(spec.createdAgo),
        participants: {
          create: [
            { userId: users[spec.requestor].id, role: "REQUESTOR" },
            ...(spec.owner ? [{ userId: users[spec.owner].id, role: "COLLABORATOR" as const }] : []),
          ],
        },
        statusHistory: {
          create: [
            { toStatus: "DRAFT", changedById: users[spec.requestor].id, createdAt: daysAgo(spec.createdAgo) },
            ...(isSubmitted
              ? [{ fromStatus: "DRAFT" as RequestStatus, toStatus: "SUBMITTED" as RequestStatus, changedById: users[spec.requestor].id, createdAt: daysAgo(spec.createdAgo) }]
              : []),
            ...(spec.status !== "DRAFT" && spec.status !== "SUBMITTED"
              ? [{ fromStatus: "SUBMITTED" as RequestStatus, toStatus: spec.status, changedById: users[spec.owner ?? "andrew"].id, note: "Progressed by Marketing", createdAt: daysAgo(Math.max(spec.createdAgo - 1, 0)) }]
              : []),
          ],
        },
      },
    });
    createdRequests[spec.title] = { id: request.id, spec };
  }

  // ---------------------------------------------------------------------
  // Enrich a handful of requests with comments, approvals, files/assets,
  // and generated content to make the full journey demoable end to end.
  // ---------------------------------------------------------------------
  const oneNorthDockReq = createdRequests["One North Dock — bringing to market"];
  const ballymountReq = createdRequests["Ballymount Logistics — new letting announcement"];
  const graftonReq = createdRequests["24 Grafton Street — new retail letting"];
  const glenviewBrochureReq = createdRequests["Glenview House — country residential brochure"];
  const anchorPitchReq = createdRequests["Logistics portfolio — pitch for Anchor Logistics"];
  const esgOpEdReq = createdRequests["ESG credentials in occupier decisions"];

  async function addComment(requestId: string, authorKey: keyof typeof users, body: string, visibility: "INTERNAL" | "REQUESTOR", agoDays: number) {
    await db.comment.create({ data: { requestId, authorId: users[authorKey].id, body, visibility, createdAt: daysAgo(agoDays) } });
  }

  async function addFileAndAsset(opts: {
    requestId: string;
    uploaderKey: keyof typeof users;
    title: string;
    filename: string;
    assetTypeTag: string;
    category: string;
    kind: "svg" | "txt";
    bg?: string;
    propertyKey?: keyof typeof properties;
    confidentiality?: string;
    tags: string[];
    agoDays: number;
  }) {
    const saved = await saveDummyFile(opts.kind, opts.title, opts.assetTypeTag.replace(/_/g, " "), opts.bg ?? pick(PALETTE, seq));
    const file = await db.file.create({
      data: {
        requestId: opts.requestId,
        uploadedById: users[opts.uploaderKey].id,
        filename: opts.filename,
        storageKey: saved.storageKey,
        mimeType: opts.kind === "svg" ? "image/svg+xml" : "text/plain",
        size: saved.size,
        assetTypeTag: opts.assetTypeTag,
        createdAt: daysAgo(opts.agoDays),
      },
    });
    const asset = await db.asset.create({
      data: {
        fileId: file.id,
        title: opts.title,
        category: opts.category,
        confidentiality: opts.confidentiality ?? "STANDARD",
        year: new Date().getFullYear(),
        propertyId: opts.propertyKey ? properties[opts.propertyKey] : undefined,
        requestId: opts.requestId,
        marketingOwnerId: users.andrew.id,
        createdAt: daysAgo(opts.agoDays),
        tags: { create: opts.tags.map((tag) => ({ tag })) },
      },
    });
    return { file, asset };
  }

  // One North Dock — completed PR journey with full activity trail
  if (oneNorthDockReq) {
    const rid = oneNorthDockReq.id;
    await addComment(rid, "andrew", "Andrew assigned Cian as Marketing owner.", "INTERNAL", 44);
    await addComment(rid, "cian", "Marketing requested additional photography of the reception area.", "REQUESTOR", 40);
    await addComment(rid, "grainne", "Uploaded five additional photographs as requested.", "REQUESTOR", 39);
    await addFileAndAsset({ requestId: rid, uploaderKey: "grainne", title: "One North Dock — exterior hero", filename: "one-north-dock-hero.svg", assetTypeTag: "hero_image", category: "Photography", kind: "svg", bg: "#16332c", propertyKey: "oneNorthDock", tags: ["One North Dock", "Office", "Exterior", "2026"], agoDays: 39 });
    await addFileAndAsset({ requestId: rid, uploaderKey: "grainne", title: "One North Dock — reception", filename: "one-north-dock-reception.svg", assetTypeTag: "additional_photography", category: "Photography", kind: "svg", bg: "#3d6b4c", propertyKey: "oneNorthDock", tags: ["One North Dock", "Office", "Interior", "2026"], agoDays: 39 });
    const draftItem = await db.contentItem.create({ data: { requestId: rid, kind: "press_release", label: "Press release — One North Dock sale" } });
    await db.contentVersion.create({ data: { contentItemId: draftItem.id, versionNumber: 1, generatedByAI: true, createdById: users.cian.id, createdAt: daysAgo(38), body: "DUBLIN — Savills Ireland has brought One North Dock, a 112,000 sq ft Dublin 1 office investment, to the market on behalf of Riverside Capital." } });
    await db.contentVersion.create({ data: { contentItemId: draftItem.id, versionNumber: 2, generatedByAI: false, status: "APPROVED", createdById: users.cian.id, createdAt: daysAgo(35), body: "DUBLIN — Savills Ireland has been appointed to sell One North Dock, a landmark 112,000 sq ft office investment in Dublin's North Docks, on behalf of Riverside Capital, guiding in excess of €68 million.\n\nFiona Lynch, Director of Capital Markets at Savills, said: \"One North Dock represents a rare opportunity to acquire a fully-let, A-rated office investment in one of Dublin's most improved locations.\"" } });
    await addComment(rid, "grainne", "Approved — please proceed to media distribution.", "REQUESTOR", 34);
    await db.approval.create({ data: { requestId: rid, itemLabel: "Press release draft", requestedById: users.cian.id, approverId: users.grainne.id, status: "APPROVED", decidedAt: daysAgo(34), createdAt: daysAgo(36) } });
  }

  // Ballymount — currently awaiting requestor (missing photography) for Awaiting You demo
  if (ballymountReq) {
    const rid = ballymountReq.id;
    await addComment(rid, "cian", "Hero photography is missing — please upload before we can finalise the release.", "REQUESTOR", 2);
    await db.notification.create({ data: { userId: users.padraig.id, type: "info_requested", title: "Photography needed", body: "Marketing needs hero photography for Ballymount Logistics Park.", link: `/requests/${rid}`, createdAt: daysAgo(2) } });
  }

  // Grafton Street — draft ready for approval
  if (graftonReq) {
    const rid = graftonReq.id;
    const item = await db.contentItem.create({ data: { requestId: rid, kind: "editorial", label: "Editorial — 24 Grafton Street" } });
    await db.contentVersion.create({ data: { contentItemId: item.id, versionNumber: 1, generatedByAI: true, createdById: users.cian.id, createdAt: daysAgo(2), body: "Savills is bringing 24 Grafton Street to the letting market — a prime 3,200 sq ft retail unit in Dublin's premier shopping thoroughfare." } });
    await db.approval.create({ data: { requestId: rid, itemLabel: "Editorial copy", requestedById: users.cian.id, approverId: users.barry.id, status: "PENDING", createdAt: daysAgo(1) } });
    await db.notification.create({ data: { userId: users.barry.id, type: "approval_requested", title: "Approval needed", body: "Editorial copy for 24 Grafton Street is ready for your review.", link: `/requests/${rid}`, createdAt: daysAgo(1) } });
  }

  // ESG op-ed — draft ready notification
  if (esgOpEdReq) {
    await db.notification.create({ data: { userId: users.fiona.id, type: "draft_ready", title: "Draft ready for review", body: "Your ESG op-ed draft is ready for approval.", link: `/requests/${esgOpEdReq.id}`, createdAt: daysAgo(1) } });
  }

  // Brochure Studio example — Glenview House
  if (glenviewBrochureReq) {
    const rid = glenviewBrochureReq.id;
    await addFileAndAsset({ requestId: rid, uploaderKey: "oisin", title: "Glenview House — front elevation", filename: "glenview-house-front.svg", assetTypeTag: "hero_image", category: "Photography", kind: "svg", bg: "#5b6b5f", propertyKey: "wicklowHouse", tags: ["Glenview House", "Country Residential", "2026"], agoDays: 11 });
    await addFileAndAsset({ requestId: rid, uploaderKey: "oisin", title: "Glenview House — floorplan", filename: "glenview-house-floorplan.svg", assetTypeTag: "floorplan", category: "Brochures", kind: "svg", bg: "#2f4a52", propertyKey: "wicklowHouse", tags: ["Glenview House", "Floorplan"], agoDays: 11 });
    const suppliedFacts = { name: "Glenview House", address: "Roundwood, Co. Wicklow", propertyType: "Country Residential", sizeSqFt: "5,400 sq ft on 12 acres", guidePrice: "€2,650,000", keyInfo: "Equestrian facilities, mountain views, private avenue" };
    await db.brochureProject.create({
      data: {
        requestId: rid,
        propertyId: properties.wicklowHouse,
        propertyType: "Country Residential",
        suppliedFacts: JSON.stringify(suppliedFacts),
        missingInfo: JSON.stringify(["BER certificate", "Agent contact details"]),
        sections: JSON.stringify([
          { key: "overview", label: "Property Overview", versions: [{ body: "Glenview House is a Country Residential opportunity located at Roundwood, Co. Wicklow, extending to approximately 5,400 sq ft on 12 acres.", generatedByAI: true, createdAt: daysAgo(11) }] },
          { key: "key_highlights", label: "Key Highlights", versions: [{ body: "Equestrian facilities, mountain views, private avenue", generatedByAI: true, createdAt: daysAgo(11) }] },
          { key: "location", label: "Location", versions: [{ body: "[location information not yet supplied]", generatedByAI: true, createdAt: daysAgo(11) }] },
        ]),
      },
    });
  }

  // Pitch Studio example — Anchor Logistics
  if (anchorPitchReq) {
    const rid = anchorPitchReq.id;
    await addFileAndAsset({ requestId: rid, uploaderKey: "padraig", title: "Anchor Logistics — RFP notes", filename: "anchor-logistics-rfp-notes.txt", assetTypeTag: "technical_document", category: "Pitches", kind: "txt", confidentiality: "CONFIDENTIAL", tags: ["Anchor Logistics", "Pitch", "Confidential"], agoDays: 5, bg: "#33566e" }, );
    await db.pitchProject.create({
      data: {
        requestId: rid,
        clientName: "Anchor Logistics Ltd",
        opportunityName: "National logistics portfolio instruction",
        submissionDeadline: daysFromNow(4),
        analysis: JSON.stringify({
          client: "Anchor Logistics Ltd",
          opportunity: "National logistics portfolio instruction",
          submissionDeadline: "[deadline not detected — check RFP document]",
          evaluationCriteria: ["Fee / commercial terms", "Track record & experience", "Team & approach", "Local market knowledge"],
          mandatorySections: ["Executive summary", "Team", "Approach & methodology", "Fees", "Case studies"],
          informationGaps: ["Known competitors for this opportunity", "What matters most to the client"],
        }),
        interviewAnswers: JSON.stringify({ whyWeCanWin: "Savills has the largest industrial & logistics agency team in Ireland and an in-house marketing/research function competitors cannot match." }),
        structure: JSON.stringify(["Executive Summary", "Understanding the Brief", "Our Team", "Track Record", "Approach & Methodology", "Fees"]),
      },
    });
  }

  // ---------------------------------------------------------------------
  // Calendar
  // ---------------------------------------------------------------------
  const calendarDefs = [
    { title: "Ashgrove Phase 2 Launch Event", type: "Event", date: daysFromNow(5), owner: "roisin", request: "Ashgrove Phase 2 — launch event", property: "ashgroveNewHomes" },
    { title: "Q3 Investment Outlook — report launch", type: "Research", date: daysFromNow(3), owner: "cian", request: "Q3 Investment Outlook — report launch", campaign: "investmentOutlook" },
    { title: "One North Dock — press release live", type: "PR Launch", date: daysAgo(35), owner: "cian", request: "One North Dock — bringing to market", property: "oneNorthDock" },
    { title: "Investment Outlook e-campaign send", type: "E-Campaign", date: daysFromNow(3), owner: "cian", campaign: "investmentOutlook" },
    { title: "PRS Amenities — LinkedIn post live", type: "Social", date: daysFromNow(1), owner: "niamh", campaign: "prsAmenities" },
    { title: "Savills Chase — client hospitality", type: "Sponsorship", date: daysFromNow(30), owner: "roisin" },
    { title: "20 Years of Savills Ireland — internal kickoff", type: "Internal", date: daysFromNow(20), owner: "andrew", campaign: "twentyYears" },
    { title: "ESG in Real Estate — op-ed publication", type: "Thought Leadership", date: daysFromNow(12), owner: "cian", campaign: "esgSeries" },
    { title: "New Homes Spring Launch — email send", type: "E-Campaign", date: daysFromNow(9), owner: "niamh", campaign: "newHomesSpring" },
    { title: "Glenview House — brochure to print", type: "Property Launch", date: daysFromNow(-1), owner: "aoife", property: "wicklowHouse" },
    { title: "24 Grafton Street — social teaser live", type: "Social", date: daysFromNow(6), owner: "niamh", property: "graftonStreetUnit" },
    { title: "SCSI Property Conference — stand build", type: "Event", date: daysAgo(25), owner: "aoife" },
  ] as const;
  for (const c of calendarDefs) {
    await db.calendarItem.create({
      data: {
        title: c.title,
        type: c.type,
        date: c.date,
        ownerId: c.owner ? users[c.owner as keyof typeof users].id : undefined,
        requestId: "request" in c && c.request ? createdRequests[c.request]?.id : undefined,
        propertyId: "property" in c && c.property ? properties[c.property as keyof typeof properties] : undefined,
        campaignId: "campaign" in c && c.campaign ? campaigns[c.campaign as keyof typeof campaigns] : undefined,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Notifications (additional, general activity)
  // ---------------------------------------------------------------------
  const notifDefs: { user: keyof typeof users; type: string; title: string; body: string; request?: string; read?: boolean; agoDays: number }[] = [
    { user: "cian", type: "request_submitted", title: "New request submitted", body: "Glenview House, Roundwood — country residential launch was submitted.", request: "Glenview House, Roundwood — country residential launch", agoDays: 1 },
    { user: "andrew", type: "request_submitted", title: "New confidential pitch submitted", body: "Local authority framework — property advisory tender needs an owner assigned.", request: "Local authority framework — property advisory tender", agoDays: 1 },
    { user: "niamh", type: "request_submitted", title: "New request submitted", body: "24 Grafton Street — social teaser was submitted.", request: "24 Grafton Street — social teaser", agoDays: 1 },
    { user: "oisin", type: "status_changed", title: "Request status updated", body: "Glenview House brochure moved to Draft Ready.", request: "Glenview House — country residential brochure", agoDays: 1, read: true },
    { user: "tom", type: "comment_added", title: "New comment", body: "Marketing commented on Ashgrove Phase 2 — launch event.", request: "Ashgrove Phase 2 — launch event", agoDays: 2, read: true },
    { user: "grainne", type: "request_completed", title: "Request completed", body: "One North Dock — bringing to market is now complete.", request: "One North Dock — bringing to market", agoDays: 34, read: true },
  ];
  for (const n of notifDefs) {
    await db.notification.create({
      data: {
        userId: users[n.user].id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.request ? `/requests/${createdRequests[n.request]?.id}` : undefined,
        read: !!n.read,
        createdAt: daysAgo(n.agoDays),
      },
    });
  }

  // ---------------------------------------------------------------------
  // Audit events
  // ---------------------------------------------------------------------
  for (const spec of specs.slice(0, 12)) {
    const r = createdRequests[spec.title];
    if (!r) continue;
    await db.auditEvent.create({
      data: {
        actorId: users[spec.requestor].id,
        action: "request.created",
        entityType: "Request",
        entityId: r.id,
        metadata: JSON.stringify({ title: spec.title }),
        createdAt: daysAgo(spec.createdAgo),
      },
    });
  }

  console.log(`Seed complete: ${Object.keys(users).length} users, ${specs.length} requests, ${propertyDefs.length} properties.`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
