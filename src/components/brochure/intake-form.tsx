"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PROPERTY_TYPES } from "@/lib/brochure/sections";
import { createBrochureProject } from "@/lib/brochure/actions";

interface PropertyOption {
  id: string;
  name: string;
  address: string;
  propertyType: string;
  sizeSqFt: string | null;
  askingPrice: string | null;
  guidePrice: string | null;
  rent: string | null;
  tenure: string | null;
  ber: string | null;
  url: string | null;
  keyInfo: string | null;
  location: string | null;
}

const FACT_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Property name" },
  { key: "address", label: "Address" },
  { key: "sizeSqFt", label: "Size" },
  { key: "askingPrice", label: "Asking price" },
  { key: "guidePrice", label: "Guide price" },
  { key: "rent", label: "Rent" },
  { key: "tenure", label: "Tenure" },
  { key: "ber", label: "BER" },
  { key: "url", label: "Property URL" },
  { key: "agentName", label: "Agent / contact" },
  { key: "keyInfo", label: "Key property information" },
  { key: "location", label: "Location information" },
];

export function BrochureIntakeForm({ requestId, properties }: { requestId: string; properties: PropertyOption[] }) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState("");
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0]);
  const [facts, setFacts] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function selectProperty(id: string) {
    setPropertyId(id);
    const p = properties.find((x) => x.id === id);
    if (p) {
      setPropertyType(p.propertyType && PROPERTY_TYPES.includes(p.propertyType) ? p.propertyType : "Other");
      setFacts((prev) => ({
        ...prev,
        name: p.name,
        address: p.address,
        sizeSqFt: p.sizeSqFt ?? "",
        askingPrice: p.askingPrice ?? "",
        guidePrice: p.guidePrice ?? "",
        rent: p.rent ?? "",
        tenure: p.tenure ?? "",
        ber: p.ber ?? "",
        url: p.url ?? "",
        keyInfo: p.keyInfo ?? "",
        location: p.location ?? "",
      }));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start the brochure</CardTitle>
        <CardDescription>
          Select an existing property to prefill known facts, or enter details manually. The system will flag
          anything still missing before generating content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="existingProperty">Existing property (optional)</Label>
            <select
              id="existingProperty"
              value={propertyId}
              onChange={(e) => selectProperty(e.target.value)}
              className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm"
            >
              <option value="">Manual entry</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.address}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="brochurePropertyType">Property type</Label>
            <select
              id="brochurePropertyType"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FACT_FIELDS.map((f) => (
            <div key={f.key} className={f.key === "keyInfo" || f.key === "location" ? "sm:col-span-2" : ""}>
              <Label htmlFor={`fact-${f.key}`}>{f.label}</Label>
              <Input
                id={`fact-${f.key}`}
                value={facts[f.key] ?? ""}
                onChange={(e) => setFacts((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await createBrochureProject(requestId, { propertyType, propertyId: propertyId || undefined, manualFacts: facts });
              router.refresh();
            })
          }
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create brochure project
        </Button>
      </CardContent>
    </Card>
  );
}
