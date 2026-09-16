"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { saveInterviewAnswers } from "@/lib/pitch/actions";

const QUESTIONS: { key: string; label: string }[] = [
  { key: "whyWeCanWin", label: "Why do we think Savills can win?" },
  { key: "competitors", label: "Who are the competitors?" },
  { key: "clientPriorities", label: "What matters most to the client?" },
  { key: "savillsTeam", label: "Who is on the Savills team?" },
  { key: "relevantExperience", label: "What relevant experience should be emphasised?" },
  { key: "differentiators", label: "What differentiates our approach?" },
  { key: "sensitivities", label: "What known client sensitivities exist?" },
  { key: "caseStudies", label: "What case studies should be used?" },
  { key: "commercialMessages", label: "What are the key commercial messages?" },
];

export function InterviewForm({ pitchProjectId, initialAnswers }: { pitchProjectId: string; initialAnswers: Record<string, string> }) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>The interview</CardTitle>
        <CardDescription>These answers ground the pitch structure and draft — the more specific, the better the first draft.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <Label htmlFor={q.key}>{q.label}</Label>
              <Textarea
                id={q.key}
                rows={2}
                value={answers[q.key] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await saveInterviewAnswers(pitchProjectId, answers);
              toast.success("Answers saved");
            })
          }
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save answers
        </Button>
      </CardContent>
    </Card>
  );
}
