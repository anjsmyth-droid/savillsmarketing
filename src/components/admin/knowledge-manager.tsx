"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createKnowledgeDocument, deleteKnowledgeDocument } from "@/lib/admin/knowledge-actions";

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  body: string;
  tags: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  brand_guidelines: "Brand Guidelines",
  tone_of_voice: "Tone of Voice",
  terminology: "Approved Terminology",
  boilerplate: "Boilerplate",
  statistics: "Approved Statistics",
  disclaimer: "Standard Disclaimers",
  example_release: "Example Press Release",
  example_brochure: "Example Brochure",
  example_pitch: "Example Pitch",
  biography: "Approved Biography",
  service_description: "Service Description",
};

export function KnowledgeManager({ docs, canEdit }: { docs: KnowledgeDoc[]; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("brand_guidelines");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {canEdit && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> Add document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add knowledge document</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="kd-title">Title</Label>
                <Input id="kd-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="kd-category">Category</Label>
                <select id="kd-category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm">
                  {Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="kd-body">Content</Label>
                <Textarea id="kd-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="kd-tags">Tags (comma separated)</Label>
                <Input id="kd-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={pending || !title || !body}
                onClick={() =>
                  startTransition(async () => {
                    await createKnowledgeDocument({ title, category, body, tags });
                    setTitle(""); setBody(""); setTags("");
                    setOpen(false);
                    toast.success("Document added");
                  })
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {docs.map((d) => (
          <Card key={d.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">{d.title}</CardTitle>
                <Badge variant="neutral" className="mt-1.5">{CATEGORY_LABEL[d.category] ?? d.category}</Badge>
              </div>
              {canEdit && (
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => { await deleteKnowledgeDocument(d.id); toast.success("Deleted"); })}
                  className="text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4">{d.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
