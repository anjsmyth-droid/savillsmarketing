"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { addComment } from "@/lib/requests/actions";

export function CommentComposer({ requestId, canPostInternal }: { requestId: string; canPostInternal: boolean }) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"INTERNAL" | "REQUESTOR">("REQUESTOR");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Textarea
        rows={3}
        placeholder={canPostInternal ? "Add an update or internal note…" : "Add an update…"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center justify-between">
        {canPostInternal ? (
          <div className="flex gap-1 rounded-md bg-surface-sunken p-1 text-xs">
            <button
              type="button"
              onClick={() => setVisibility("REQUESTOR")}
              className={`rounded px-2 py-1 font-medium ${visibility === "REQUESTOR" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}
            >
              Requestor update
            </button>
            <button
              type="button"
              onClick={() => setVisibility("INTERNAL")}
              className={`rounded px-2 py-1 font-medium ${visibility === "INTERNAL" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}
            >
              Internal note
            </button>
          </div>
        ) : (
          <span />
        )}
        <Button
          size="sm"
          disabled={pending || !body.trim()}
          onClick={() =>
            startTransition(async () => {
              await addComment(requestId, body, canPostInternal ? visibility : "REQUESTOR");
              setBody("");
            })
          }
        >
          Post
        </Button>
      </div>
    </div>
  );
}
