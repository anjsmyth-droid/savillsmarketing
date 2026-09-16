"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  addAssetType, addMediaOutlet, addServiceLine,
  deleteAssetType, deleteServiceLine, toggleMediaOutletActive, toggleRequestTypeActive,
} from "@/lib/admin/settings-actions";
import { DynamicIcon } from "@/components/dynamic-icon";

export function RequestTypesPanel({ types }: { types: { key: string; label: string; description: string; icon: string; category: string; active: boolean }[] }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-2">
      {types.map((t) => (
        <Card key={t.key}>
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><DynamicIcon name={t.icon} className="h-4 w-4" /></span>
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.category}</div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={t.active}
                disabled={pending}
                onCheckedChange={(c) => startTransition(async () => { await toggleRequestTypeActive(t.key, !!c); toast.success("Updated"); })}
              />
              Active
            </label>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MediaOutletsPanel({ outlets }: { outlets: { id: string; name: string; category: string; active: boolean }[] }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("National");
  const categories = ["National", "Property / Trade", "Broadcast", "Regional"];
  const grouped = categories.map((c) => ({ category: c, items: outlets.filter((o) => o.category === c) }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Outlet name" className="w-48" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-border-strong bg-surface px-2.5 text-sm">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button
          size="sm"
          disabled={pending || !name.trim()}
          onClick={() => startTransition(async () => { await addMediaOutlet(name.trim(), category); setName(""); toast.success("Added"); })}
        >
          <Plus className="h-4 w-4" /> Add outlet
        </Button>
      </div>
      {grouped.map((g) => (
        <div key={g.category}>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.category}</div>
          <div className="flex flex-wrap gap-2">
            {g.items.map((o) => (
              <button
                key={o.id}
                disabled={pending}
                onClick={() => startTransition(async () => { await toggleMediaOutletActive(o.id, !o.active); })}
              >
                <Badge variant={o.active ? "neutral" : "outline"}>{o.name}{!o.active && " (inactive)"}</Badge>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimpleListPanel({
  items,
  onAdd,
  onDelete,
  placeholder,
}: {
  items: { id: string; name: string }[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  placeholder: string;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className="w-64" />
        <Button size="sm" disabled={pending || !name.trim()} onClick={() => startTransition(async () => { await onAdd(name.trim()); setName(""); toast.success("Added"); })}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i.id} className="flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 text-xs">
            {i.name}
            <button disabled={pending} onClick={() => startTransition(async () => { await onDelete(i.id); })} className="text-muted-foreground hover:text-danger">
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function ServiceLinesPanel({ items }: { items: { id: string; name: string }[] }) {
  return <SimpleListPanel items={items} onAdd={addServiceLine} onDelete={deleteServiceLine} placeholder="Service line name" />;
}

export function AssetTypesPanel({ items }: { items: { id: string; name: string }[] }) {
  return <SimpleListPanel items={items} onAdd={addAssetType} onDelete={deleteAssetType} placeholder="Asset type name" />;
}
