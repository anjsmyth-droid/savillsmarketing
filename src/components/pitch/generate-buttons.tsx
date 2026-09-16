"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateFullDraft, generateStructure } from "@/lib/pitch/actions";

export function GenerateStructureButton({ pitchProjectId }: { pitchProjectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() => startTransition(async () => { await generateStructure(pitchProjectId); router.refresh(); })}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Pitch Structure
    </Button>
  );
}

export function GenerateAllDraftsButton({ pitchProjectId }: { pitchProjectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() => startTransition(async () => { await generateFullDraft(pitchProjectId); router.refresh(); })}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate First Draft
    </Button>
  );
}
