"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, History, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { generateSectionContent, saveSectionEdit } from "@/lib/brochure/actions";
import type { SectionVersion } from "@/lib/brochure/sections";

export function SectionEditor({
  brochureProjectId,
  sectionKey,
  label,
  versions,
}: {
  brochureProjectId: string;
  sectionKey: string;
  label: string;
  versions: SectionVersion[];
}) {
  const latest = versions[versions.length - 1];
  const [draft, setDraft] = useState(latest?.body ?? "");
  const [dirty, setDirty] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(mode: "generate" | "regenerate" | "shorten" | "expand" | "emphasis") {
    startTransition(async () => {
      const v = await generateSectionContent(brochureProjectId, sectionKey, mode);
      setDraft(v.body);
      setDirty(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{label}</CardTitle>
        <div className="flex items-center gap-1.5">
          {versions.length > 0 && (
            <button onClick={() => setShowHistory((s) => !s)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-sunken" title="Version history">
              <History className="h-4 w-4" />
            </button>
          )}
          {latest && (
            <button
              onClick={() => { navigator.clipboard.writeText(draft); toast.success("Copied"); }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-sunken"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showHistory && versions.length > 0 && (
          <div className="space-y-1.5 rounded-md border border-border bg-surface-sunken/50 p-2 text-xs">
            {versions.map((v, i) => (
              <div key={i} className="flex items-center justify-between">
                <span>Version {i + 1} {v.generatedByAI ? "· AI generated" : "· manual edit"}</span>
                <span className="text-muted-foreground">{formatDateTime(v.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        {latest ? (
          <>
            <div className="flex items-center gap-2">
              {latest.generatedByAI && <Badge variant="accent"><Sparkles className="h-3 w-3" /> AI generated — review before use</Badge>}
            </div>
            <Textarea
              rows={5}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => run("regenerate")}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Regenerate
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => run("shorten")}>Shorten</Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => run("expand")}>Expand</Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => run("emphasis")}>Change emphasis</Button>
              {dirty && (
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await saveSectionEdit(brochureProjectId, sectionKey, draft);
                      setDirty(false);
                      toast.success("Version saved");
                    })
                  }
                >
                  Save version
                </Button>
              )}
            </div>
          </>
        ) : (
          <Button size="sm" disabled={pending} onClick={() => run("generate")}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Generate Content
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
