import type { WorkflowDefinition } from "./types";

export const WORKFLOW_DEFINITIONS: Record<string, WorkflowDefinition> = {
  property_pr: {
    typeKey: "property_pr",
    requiredFields: [
      { key: "whatsHappening", label: "What we're promoting" },
      { key: "propertyType", label: "Property type" },
      { key: "propertyName", label: "Property name" },
      { key: "address", label: "Full address" },
      { key: "whatsHappeningDetail", label: "What is happening" },
      { key: "sellingPoints", label: "Key selling points" },
    ],
    summaryFields: ["propertyName", "address", "whatsHappening", "askingPrice", "guidePrice", "rent"],
    steps: [
      {
        key: "promoting",
        title: "What are we promoting?",
        fields: [
          {
            key: "whatsHappening", label: "Select the situation", type: "radio", required: true,
            options: [
              { value: "Property for sale", label: "Property for sale" },
              { value: "Property to let", label: "Property to let" },
              { value: "New instruction", label: "New instruction" },
              { value: "Development launch", label: "Development launch" },
              { value: "Transaction completed", label: "Transaction completed" },
              { value: "Tenant announcement", label: "Tenant announcement" },
              { value: "Investment opportunity", label: "Investment opportunity" },
              { value: "New Homes development", label: "New Homes development" },
              { value: "Other", label: "Other" },
            ],
          },
        ],
      },
      {
        key: "property_type",
        title: "Property type",
        fields: [
          {
            key: "propertyType", label: "Select property type", type: "radio", required: true,
            options: [
              "Office", "Industrial & Logistics", "Retail", "Investment", "Development Land",
              "Hotels", "Residential", "New Homes", "Country Residential", "Other",
            ].map((v) => ({ value: v, label: v })),
          },
        ],
      },
      {
        key: "property_details",
        title: "Property details",
        description: "Only the fields relevant to this property type are shown.",
        fields: [
          { key: "propertyName", label: "Property name", type: "text", required: true, colSpan: 2 },
          { key: "address", label: "Full address", type: "text", required: true, colSpan: 2 },
          { key: "serviceLine", label: "Service line", type: "select", optionsSource: "serviceLines" },
          { key: "agentName", label: "Agent / contact", type: "text" },
          { key: "clientName", label: "Client / vendor / landlord / developer", type: "text", colSpan: 2 },
          { key: "askingPrice", label: "Asking price", type: "text", showIf: { field: "whatsHappening", in: ["Property for sale", "New instruction", "Investment opportunity"] } },
          { key: "guidePrice", label: "Guide price", type: "text", showIf: { field: "whatsHappening", in: ["Investment opportunity", "New instruction"] } },
          { key: "rent", label: "Rent", type: "text", showIf: { field: "whatsHappening", in: ["Property to let", "New instruction", "Tenant announcement"] } },
          { key: "sizeSqFt", label: "Size", type: "text" },
          { key: "tenure", label: "Tenure", type: "text" },
          { key: "ber", label: "BER / sustainability information", type: "text" },
          { key: "propertyUrl", label: "Property URL", type: "text", colSpan: 2 },
          { key: "keyInfo", label: "Key property information", type: "textarea", colSpan: 2 },
          { key: "location", label: "Location information", type: "textarea", colSpan: 2 },
        ],
      },
      {
        key: "story",
        title: "The story",
        fields: [
          { key: "whatsHappeningDetail", label: "What is happening?", type: "textarea", required: true, colSpan: 2 },
          { key: "whyInteresting", label: "Why is this interesting?", type: "textarea", colSpan: 2 },
          { key: "whatsNew", label: "What is new?", type: "textarea", colSpan: 2 },
          { key: "sellingPoints", label: "Key selling points", type: "textarea", required: true, colSpan: 2 },
          { key: "history", label: "Interesting history / background", type: "textarea", colSpan: 2 },
          { key: "marketContext", label: "Relevant market context", type: "textarea", colSpan: 2 },
          { key: "quoteRequired", label: "Is a Savills quote required?", type: "boolean" },
          { key: "quotePerson", label: "Who should be quoted?", type: "text", showIf: { field: "quoteRequired", truthy: true } },
          { key: "sensitivities", label: "Any sensitivities Marketing should know about?", type: "textarea", colSpan: 2 },
        ],
      },
      {
        key: "pr_requirements",
        title: "PR requirements",
        fields: [
          { key: "pressReleaseRequired", label: "Press release required?", type: "boolean" },
          { key: "editorialRequired", label: "Property editorial required?", type: "boolean" },
          { key: "exclusiveApproach", label: "Exclusive media approach?", type: "boolean" },
          { key: "broadRelease", label: "Broad media release?", type: "boolean" },
          { key: "launchDate", label: "Desired launch / publication date", type: "date" },
          { key: "embargoDate", label: "Embargo date/time (if applicable)", type: "date" },
          { key: "targetMedia", label: "Target media", type: "multiselect", optionsSource: "mediaOutlets", colSpan: 2 },
        ],
      },
      {
        key: "assets",
        title: "Assets",
        description: "Upload and classify supporting files. These automatically become part of the Marketing Library.",
        fields: [
          { key: "heroImageFiles", label: "Hero image", type: "file-upload", assetTypeTag: "hero_image" },
          { key: "additionalPhotographyFiles", label: "Additional photography", type: "file-upload", assetTypeTag: "additional_photography" },
          { key: "cgiRenderFiles", label: "CGI / render", type: "file-upload", assetTypeTag: "cgi_render" },
          { key: "brochureFiles", label: "Existing brochure", type: "file-upload", assetTypeTag: "brochure" },
          { key: "floorplanFiles", label: "Floorplan", type: "file-upload", assetTypeTag: "floorplan" },
          { key: "mapFiles", label: "Map", type: "file-upload", assetTypeTag: "map" },
          { key: "headshotFiles", label: "Agent headshot", type: "file-upload", assetTypeTag: "agent_headshot" },
          { key: "existingCopyFiles", label: "Existing copy", type: "file-upload", assetTypeTag: "existing_copy" },
          { key: "technicalFiles", label: "Technical document", type: "file-upload", assetTypeTag: "technical_document" },
          { key: "otherFiles", label: "Other", type: "file-upload", assetTypeTag: "other" },
        ],
      },
    ],
  },

  pr_media: {
    typeKey: "pr_media",
    requiredFields: [
      { key: "subject", label: "Subject" },
      { key: "angle", label: "Angle / context" },
    ],
    summaryFields: ["subject", "spokesperson", "requiredDate"],
    steps: [
      {
        key: "request",
        title: "The request",
        fields: [
          { key: "subject", label: "Subject", type: "text", required: true, colSpan: 2 },
          { key: "angle", label: "Angle / background", type: "textarea", required: true, colSpan: 2 },
          { key: "spokesperson", label: "Spokesperson", type: "text" },
          { key: "requiredDate", label: "Required by", type: "date" },
        ],
      },
      {
        key: "media",
        title: "Target media",
        fields: [
          { key: "targetMedia", label: "Target media", type: "multiselect", optionsSource: "mediaOutlets", colSpan: 2 },
          { key: "exclusiveApproach", label: "Exclusive approach to one outlet?", type: "boolean" },
        ],
      },
    ],
  },

  op_ed: {
    typeKey: "op_ed",
    requiredFields: [
      { key: "idea", label: "Your idea" },
      { key: "mainArgument", label: "Main argument" },
      { key: "audience", label: "Intended audience" },
    ],
    summaryFields: ["idea", "targetPublication", "deadline"],
    steps: [
      {
        key: "idea",
        title: "Your idea",
        fields: [
          { key: "idea", label: "What is your idea?", type: "textarea", required: true, colSpan: 2 },
          { key: "mainArgument", label: "What is the main argument you want to make?", type: "textarea", required: true, colSpan: 2 },
          { key: "relevance", label: "Why is this relevant now?", type: "textarea", colSpan: 2 },
          { key: "audience", label: "Who is the intended audience?", type: "text", required: true, colSpan: 2 },
        ],
      },
      {
        key: "evidence",
        title: "Evidence & perspective",
        fields: [
          { key: "evidence", label: "What evidence/data supports the argument?", type: "textarea", colSpan: 2 },
          { key: "respondingToNews", label: "Are you responding to a current issue/news story?", type: "boolean" },
          { key: "perspective", label: "What is your personal/professional perspective?", type: "textarea", colSpan: 2 },
          { key: "takeaway", label: "What should the reader take away?", type: "textarea", colSpan: 2 },
        ],
      },
      {
        key: "publication",
        title: "Publication & timing",
        fields: [
          { key: "targetPublication", label: "Which publication would you ideally target?", type: "text" },
          { key: "deadline", label: "Is there a deadline?", type: "date" },
          { key: "hasDraft", label: "Do you already have a draft?", type: "boolean" },
          { key: "draftFiles", label: "Upload your draft", type: "file-upload", assetTypeTag: "existing_copy", showIf: { field: "hasDraft", truthy: true } },
        ],
      },
    ],
  },

  social_media: {
    typeKey: "social_media",
    requiredFields: [
      { key: "objective", label: "Objective" },
      { key: "platform", label: "Platform" },
      { key: "message", label: "Message" },
    ],
    summaryFields: ["platform", "objective", "requiredDate"],
    steps: [
      {
        key: "campaign",
        title: "The campaign",
        fields: [
          { key: "objective", label: "Objective", type: "textarea", required: true, colSpan: 2 },
          { key: "platform", label: "Platform", type: "select", required: true, options: ["LinkedIn", "Instagram", "X", "Facebook", "TikTok", "Other"].map((v) => ({ value: v, label: v })) },
          { key: "audience", label: "Audience", type: "text" },
          { key: "message", label: "Message", type: "textarea", required: true, colSpan: 2 },
        ],
      },
      {
        key: "detail",
        title: "Detail",
        fields: [
          { key: "relatedProperty", label: "Relevant property / campaign", type: "property-picker", colSpan: 2 },
          { key: "requiredDate", label: "Required date", type: "date" },
          { key: "urls", label: "URLs", type: "text" },
          { key: "tags", label: "People/organisations to tag", type: "text", colSpan: 2 },
          { key: "paidPromotion", label: "Is paid promotion requested?", type: "boolean" },
          { key: "assetFiles", label: "Supporting assets", type: "file-upload", assetTypeTag: "other" },
        ],
      },
    ],
  },

  email_campaign: {
    typeKey: "email_campaign",
    requiredFields: [
      { key: "campaignName", label: "Campaign name" },
      { key: "objective", label: "Objective" },
      { key: "subject", label: "Subject" },
    ],
    summaryFields: ["campaignName", "sendDate", "audience"],
    steps: [
      {
        key: "campaign",
        title: "Campaign",
        fields: [
          { key: "campaignName", label: "Campaign name", type: "text", required: true, colSpan: 2 },
          { key: "objective", label: "Objective", type: "textarea", required: true, colSpan: 2 },
          { key: "audience", label: "Target list / audience description", type: "text", colSpan: 2 },
          { key: "sendDate", label: "Proposed send date", type: "date" },
        ],
      },
      {
        key: "message",
        title: "Message",
        fields: [
          { key: "subject", label: "Subject line", type: "text", required: true, colSpan: 2 },
          { key: "message", label: "Body message", type: "textarea", colSpan: 2 },
          { key: "callToAction", label: "Call to action", type: "text" },
          { key: "links", label: "Links", type: "text" },
        ],
      },
      {
        key: "approval",
        title: "Approval & assets",
        fields: [
          { key: "approver", label: "Approver", type: "text" },
          { key: "assetFiles", label: "Supporting assets", type: "file-upload", assetTypeTag: "other" },
        ],
      },
    ],
  },

  event_marketing: {
    typeKey: "event_marketing",
    requiredFields: [
      { key: "eventName", label: "Event name" },
      { key: "date", label: "Date" },
      { key: "venue", label: "Venue" },
      { key: "objective", label: "Event objective" },
    ],
    summaryFields: ["eventName", "date", "venue", "expectedAttendance"],
    steps: [
      {
        key: "details",
        title: "Event details",
        fields: [
          { key: "eventName", label: "Event name", type: "text", required: true, colSpan: 2 },
          { key: "date", label: "Date", type: "date", required: true },
          { key: "time", label: "Time", type: "text" },
          { key: "venue", label: "Venue", type: "text", required: true, colSpan: 2 },
          { key: "audience", label: "Audience", type: "text" },
          { key: "expectedAttendance", label: "Expected attendance", type: "text" },
          { key: "objective", label: "Event objective", type: "textarea", required: true, colSpan: 2 },
        ],
      },
      {
        key: "format",
        title: "Format & requirements",
        fields: [
          { key: "speakers", label: "Speakers", type: "textarea", colSpan: 2 },
          { key: "format", label: "Format", type: "text" },
          { key: "invitationRequirements", label: "Invitation requirements", type: "textarea", colSpan: 2 },
          { key: "registrationRequirements", label: "Registration requirements", type: "textarea", colSpan: 2 },
          { key: "branding", label: "Branding required?", type: "boolean" },
        ],
      },
      {
        key: "supporting",
        title: "Supporting requirements",
        fields: [
          { key: "photographyVideo", label: "Photography / video required?", type: "boolean" },
          { key: "socialRequired", label: "Social requirements?", type: "boolean" },
          { key: "prRequired", label: "PR requirements?", type: "boolean" },
          { key: "emailRequired", label: "Email campaign requirements?", type: "boolean" },
          { key: "postEventRequirements", label: "Post-event requirements", type: "textarea", colSpan: 2 },
          { key: "assetFiles", label: "Supporting assets", type: "file-upload", assetTypeTag: "other" },
        ],
      },
    ],
  },

  research_report: {
    typeKey: "research_report",
    requiredFields: [
      { key: "reportTitle", label: "Report title" },
      { key: "topic", label: "Topic" },
    ],
    summaryFields: ["reportTitle", "launchDate", "targetAudience"],
    steps: [
      {
        key: "report",
        title: "Report / research launch",
        fields: [
          { key: "reportTitle", label: "Report title", type: "text", required: true, colSpan: 2 },
          { key: "topic", label: "Topic", type: "textarea", required: true, colSpan: 2 },
          { key: "keyFindings", label: "Key findings", type: "textarea", colSpan: 2 },
          { key: "launchDate", label: "Launch date", type: "date" },
          { key: "targetAudience", label: "Target audience", type: "text" },
          { key: "assetFiles", label: "Supporting documents", type: "file-upload", assetTypeTag: "technical_document" },
        ],
      },
    ],
  },

  internal_comms: {
    typeKey: "internal_comms",
    requiredFields: [
      { key: "topic", label: "Topic" },
      { key: "keyMessages", label: "Key messages" },
    ],
    summaryFields: ["topic", "channel", "requiredDate"],
    steps: [
      {
        key: "comms",
        title: "Internal communication",
        fields: [
          { key: "topic", label: "Topic", type: "text", required: true, colSpan: 2 },
          { key: "audience", label: "Audience", type: "text" },
          { key: "channel", label: "Channel", type: "select", options: ["All-staff email", "Intranet", "Teams", "All-staff email + intranet", "Other"].map((v) => ({ value: v, label: v })) },
          { key: "keyMessages", label: "Key messages", type: "textarea", required: true, colSpan: 2 },
          { key: "requiredDate", label: "Required date", type: "date" },
        ],
      },
    ],
  },

  creative_design: {
    typeKey: "creative_design",
    requiredFields: [
      { key: "deliverable", label: "Deliverable" },
      { key: "objective", label: "Objective" },
    ],
    summaryFields: ["projectType", "deliverable", "requiredDate"],
    steps: [
      {
        key: "brief",
        title: "The brief",
        fields: [
          { key: "projectType", label: "Project type", type: "select", options: ["Print", "Digital", "Presentation", "Signage", "Other"].map((v) => ({ value: v, label: v })) },
          { key: "deliverable", label: "Deliverable", type: "text", required: true, colSpan: 2 },
          { key: "dimensionsFormat", label: "Dimensions / format (if known)", type: "text" },
          { key: "objective", label: "Objective", type: "textarea", required: true, colSpan: 2 },
          { key: "audience", label: "Audience", type: "text", colSpan: 2 },
        ],
      },
      {
        key: "logistics",
        title: "Logistics",
        fields: [
          { key: "copySupplied", label: "Copy supplied?", type: "boolean" },
          { key: "photographySupplied", label: "Photography supplied?", type: "boolean" },
          { key: "requiredDate", label: "Required date", type: "date" },
          { key: "printOrDigital", label: "Print or digital?", type: "select", options: ["Print", "Digital"].map((v) => ({ value: v, label: v })) },
          { key: "quantity", label: "Quantity (if print)", type: "text", showIf: { field: "printOrDigital", equals: "Print" } },
          { key: "previousExampleFiles", label: "Previous example / reference", type: "file-upload", assetTypeTag: "existing_copy" },
          { key: "assetFiles", label: "Supporting assets", type: "file-upload", assetTypeTag: "other" },
        ],
      },
    ],
  },

  other: {
    typeKey: "other",
    requiredFields: [{ key: "description", label: "Description" }],
    summaryFields: ["description", "requiredDate"],
    steps: [
      {
        key: "details",
        title: "Tell us what you need",
        fields: [
          { key: "description", label: "What do you need help with?", type: "textarea", required: true, colSpan: 2 },
          { key: "objective", label: "Objective", type: "textarea", colSpan: 2 },
          { key: "requiredDate", label: "Required date", type: "date" },
          { key: "assetFiles", label: "Supporting files", type: "file-upload", assetTypeTag: "other" },
        ],
      },
    ],
  },
};

export function getWorkflowDefinition(typeKey: string): WorkflowDefinition | undefined {
  return WORKFLOW_DEFINITIONS[typeKey];
}
