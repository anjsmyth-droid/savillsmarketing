"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { generateDraftSection, saveDraftSection } from "@/lib/pitch/actions";

export function PitchSectionEditor({ pitchProjectId, sectionName, body }: { pitchProjectId: string; sectionName: string; body: string }) {
  const [draft, setDraft] = useState(body);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{sectionName}</CardTitle>
        {draft && (
          <button onClick={() => { navigator.clipboard.writeText(draft); toast.success("Copied"); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-sunken">
            <Copy className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {draft ? (
          <>
            <Badge variant="accent"><Sparkles className="h-3 w-3" /> AI generated — review before use</Badge>
            <Textarea rows={5} value={draft} onChange={(e) => { setDraft(e.target.value); setDirty(true); }} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Not drafted yet.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const newBody = await generateDraftSection(pitchProjectId, sectionName);
                setDraft(newBody);
                setDirty(false);
              })
            }
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {draft ? "Regenerate" : "Generate"}
          </Button>
          {dirty && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await saveDraftSection(pitchProjectId, sectionName, draft);
                  setDirty(false);
                  toast.success("Saved");
                })
              }
            >
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
