"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTypeSpecificInsight } from "@/lib/requests/ai-actions";

export function GenerateInsightButton({ requestId, label }: { requestId: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => { await generateTypeSpecificInsight(requestId); router.refresh(); })}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {label}
    </Button>
  );
}
