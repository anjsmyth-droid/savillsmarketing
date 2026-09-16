"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { analyzeTender } from "@/lib/pitch/actions";

export function PitchIntakeForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [opportunityName, setOpportunityName] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tender analysis</CardTitle>
        <CardDescription>
          Upload the RFP and supporting documents below, then paste the key text here (client, scope, evaluation
          criteria, deadlines) — the analysis works from whatever text you provide.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="clientName">Client</Label>
            <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="opportunityName">Opportunity</Label>
            <Input id="opportunityName" value={opportunityName} onChange={(e) => setOpportunityName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="submissionDeadline">Submission deadline</Label>
            <Input id="submissionDeadline" type="date" value={submissionDeadline} onChange={(e) => setSubmissionDeadline(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="documentText">RFP / tender text</Label>
          <Textarea id="documentText" rows={6} value={documentText} onChange={(e) => setDocumentText(e.target.value)} placeholder="Paste the tender scope, evaluation criteria, submission requirements…" />
        </div>
        <Button
          disabled={pending || !clientName || !opportunityName}
          onClick={() =>
            startTransition(async () => {
              await analyzeTender(requestId, { clientName, opportunityName, documentText, submissionDeadline: submissionDeadline || undefined });
              router.refresh();
            })
          }
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyse tender
        </Button>
      </CardContent>
    </Card>
  );
}
