"use client";

import { useState } from "react";
import { toast } from "sonner";
import { File as FileIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRequestFile, uploadRequestFile } from "@/lib/requests/actions";

export interface RequestFileItem {
  id: string;
  filename: string;
  assetTypeTag: string;
  mimeType: string;
  uploadedByName: string;
  createdAt: string;
}

const TAG_LABEL: Record<string, string> = {
  hero_image: "Hero Image",
  additional_photography: "Additional Photography",
  cgi_render: "CGI / Render",
  brochure: "Brochure",
  floorplan: "Floorplan",
  map: "Map",
  agent_headshot: "Agent Headshot",
  existing_copy: "Existing Copy",
  technical_document: "Technical Document",
  other: "Other",
};

export function FilesPanel({ requestId, files, assetTypeOptions, canEdit }: { requestId: string; files: RequestFileItem[]; assetTypeOptions: string[]; canEdit: boolean }) {
  const [items, setItems] = useState(files);
  const [uploading, setUploading] = useState(false);
  const [tag, setTag] = useState(assetTypeOptions[0] ?? "other");

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border-strong p-3">
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="h-9 rounded-md border border-border-strong bg-surface px-2 text-sm"
          >
            {assetTypeOptions.map((t) => (
              <option key={t} value={t}>
                {TAG_LABEL[t] ?? t}
              </option>
            ))}
          </select>
          <label>
            <Button asChild size="sm" variant="secondary" disabled={uploading}>
              <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload files</span>
            </Button>
            <input
              type="file"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const selected = Array.from(e.target.files ?? []);
                if (!selected.length) return;
                setUploading(true);
                try {
                  for (const file of selected) {
                    const fd = new FormData();
                    fd.set("requestId", requestId);
                    fd.set("assetTypeTag", tag);
                    fd.set("file", file);
                    const result = await uploadRequestFile(fd);
                    setItems((prev) => [
                      { id: result.id, filename: result.filename, assetTypeTag: result.assetTypeTag, mimeType: file.type, uploadedByName: "You", createdAt: new Date().toISOString() },
                      ...prev,
                    ]);
                  }
                  toast.success("Files uploaded");
                } catch {
                  toast.error("Upload failed");
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-border py-12 text-center text-sm text-muted-foreground">No files uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <div key={f.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
              {f.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/files/${f.id}`} alt={f.filename} className="h-14 w-14 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-surface-sunken">
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.filename}</div>
                <div className="text-xs text-muted-foreground">{TAG_LABEL[f.assetTypeTag] ?? f.assetTypeTag}</div>
                <div className="text-xs text-muted-foreground">by {f.uploadedByName}</div>
              </div>
              {canEdit && (
                <button
                  className="text-muted-foreground hover:text-danger"
                  onClick={async () => {
                    await deleteRequestFile(f.id);
                    setItems((prev) => prev.filter((x) => x.id !== f.id));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
