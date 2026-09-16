"use client";

import { useState } from "react";
import { toast } from "sonner";
import { File as FileIcon, Lock, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { LIBRARY_CATEGORIES } from "@/lib/library/constants";
import { updateAssetMetadata } from "@/lib/library/actions";
import { formatDate } from "@/lib/utils";

export interface AssetCardData {
  id: string;
  fileId: string;
  title: string;
  category: string;
  confidentiality: string;
  year: number;
  mimeType: string;
  propertyName: string | null;
  clientName: string | null;
  serviceLine: string | null;
  createdAt: string;
  tags: string[];
}

export function AssetCard({ asset, canEdit }: { asset: AssetCardData; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(asset.title);
  const [category, setCategory] = useState(asset.category);
  const [confidentiality, setConfidentiality] = useState(asset.confidentiality);
  const [tags, setTags] = useState(asset.tags.join(", "));
  const [saving, setSaving] = useState(false);

  return (
    <>
      <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full bg-surface-sunken">
          {asset.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${asset.fileId}`} alt={asset.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FileIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          {asset.confidentiality === "CONFIDENTIAL" && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60">
              <Lock className="h-3.5 w-3.5 text-white" />
            </span>
          )}
          {canEdit && (
            <button
              onClick={() => setOpen(true)}
              className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <div className="truncate text-sm font-medium">{asset.title}</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral">{asset.category}</Badge>
            <span className="text-xs text-muted-foreground">{asset.year}</span>
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {[asset.propertyName, asset.clientName, asset.serviceLine].filter(Boolean).join(" · ") || formatDate(asset.createdAt)}
          </div>
        </div>
      </Card>

      {canEdit && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit asset metadata</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm"
                  >
                    {LIBRARY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Confidentiality</Label>
                  <select
                    value={confidentiality}
                    onChange={(e) => setConfidentiality(e.target.value)}
                    className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await updateAssetMetadata(asset.id, {
                      title,
                      category,
                      confidentiality,
                      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    });
                    toast.success("Asset updated");
                    setOpen(false);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
