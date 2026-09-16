export interface SectionDef {
  key: string;
  label: string;
}

const ALL_SECTIONS: Record<string, SectionDef> = {
  overview: { key: "overview", label: "Property Overview" },
  key_highlights: { key: "key_highlights", label: "Key Highlights" },
  location: { key: "location", label: "Location" },
  description: { key: "description", label: "Description" },
  accommodation: { key: "accommodation", label: "Accommodation" },
  specification: { key: "specification", label: "Specification" },
  sustainability: { key: "sustainability", label: "Sustainability" },
  transport_connectivity: { key: "transport_connectivity", label: "Transport & Connectivity" },
  tenancy: { key: "tenancy", label: "Tenancy" },
  investment_information: { key: "investment_information", label: "Investment Information" },
  viewing: { key: "viewing", label: "Viewing" },
  contacts: { key: "contacts", label: "Contacts" },
};

const SECTIONS_BY_TYPE: Record<string, string[]> = {
  Investment: ["overview", "key_highlights", "location", "description", "tenancy", "investment_information", "sustainability", "transport_connectivity", "viewing", "contacts"],
  Office: ["overview", "key_highlights", "location", "description", "accommodation", "specification", "sustainability", "transport_connectivity", "tenancy", "viewing", "contacts"],
  "Industrial & Logistics": ["overview", "key_highlights", "location", "description", "accommodation", "specification", "sustainability", "transport_connectivity", "tenancy", "viewing", "contacts"],
  Retail: ["overview", "key_highlights", "location", "description", "accommodation", "specification", "transport_connectivity", "tenancy", "viewing", "contacts"],
  "Development Land": ["overview", "key_highlights", "location", "description", "specification", "sustainability", "transport_connectivity", "viewing", "contacts"],
  Hotels: ["overview", "key_highlights", "location", "description", "accommodation", "specification", "sustainability", "viewing", "contacts"],
  Residential: ["overview", "key_highlights", "location", "description", "accommodation", "specification", "sustainability", "viewing", "contacts"],
  "New Homes": ["overview", "key_highlights", "location", "description", "specification", "sustainability", "transport_connectivity", "viewing", "contacts"],
  "Country Residential": ["overview", "key_highlights", "location", "description", "accommodation", "specification", "sustainability", "transport_connectivity", "viewing", "contacts"],
  Other: ["overview", "key_highlights", "location", "description", "viewing", "contacts"],
};

export function sectionsForPropertyType(propertyType: string): SectionDef[] {
  const keys = SECTIONS_BY_TYPE[propertyType] ?? SECTIONS_BY_TYPE.Other;
  return keys.map((k) => ALL_SECTIONS[k]);
}

export const PROPERTY_TYPES = Object.keys(SECTIONS_BY_TYPE);

export interface SectionVersion {
  body: string;
  generatedByAI: boolean;
  createdAt: string;
}

export interface StoredSection {
  key: string;
  label: string;
  versions: SectionVersion[];
}

export const IMPORTANT_FACT_KEYS: { key: string; label: string }[] = [
  { key: "name", label: "Property name" },
  { key: "address", label: "Address" },
  { key: "sizeSqFt", label: "Size" },
  { key: "ber", label: "BER / sustainability rating" },
  { key: "keyInfo", label: "Key property information" },
  { key: "location", label: "Location information" },
  { key: "agentName", label: "Agent / contact" },
];
