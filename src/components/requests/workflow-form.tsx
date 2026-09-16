"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate } from "@/lib/utils";
import type { WorkflowField, WorkflowStep } from "@/lib/workflows/types";
import { saveDraft, submitRequest, uploadRequestFile, deleteRequestFile } from "@/lib/requests/actions";

type Values = Record<string, unknown>;

interface UploadedFile {
  id: string;
  filename: string;
  assetTypeTag: string;
}

function fieldVisible(field: WorkflowField, values: Values): boolean {
  if (!field.showIf) return true;
  const current = values[field.showIf.field];
  if (field.showIf.truthy !== undefined) return field.showIf.truthy ? !!current : !current;
  if (field.showIf.equals !== undefined) return current === field.showIf.equals;
  if (field.showIf.in) return typeof current === "string" && field.showIf.in.includes(current);
  return true;
}

function FieldInput({
  field,
  value,
  onChange,
  requestId,
  files,
  onFilesChange,
}: {
  field: WorkflowField;
  value: unknown;
  onChange: (v: unknown) => void;
  requestId: string;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  if (field.type === "text") {
    return <Input id={field.key} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
  }
  if (field.type === "textarea") {
    return <Textarea id={field.key} rows={3} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
  }
  if (field.type === "date") {
    return <Input id={field.key} type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2.5 pt-2">
        <Checkbox checked={!!value} onCheckedChange={(c) => onChange(!!c)} />
        <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
      </label>
    );
  }
  if (field.type === "select" || field.type === "property-picker" || field.type === "client-picker") {
    return (
      <select
        id={field.key}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <option value="">Select…</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "radio") {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {field.options?.map((o) => {
          const active = value === o.value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                active ? "border-accent bg-accent-soft font-medium" : "border-border-strong hover:bg-surface-sunken"
              )}
            >
              {active && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (field.type === "multiselect") {
    const selected = new Set((value as string[]) ?? []);
    return (
      <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
        {field.options?.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.has(o.value)}
              onCheckedChange={(c) => {
                const next = new Set(selected);
                if (c) next.add(o.value);
                else next.delete(o.value);
                onChange(Array.from(next));
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "file-upload") {
    return (
      <div className="space-y-2">
        {files.length > 0 && (
          <ul className="space-y-1.5">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-md border border-border bg-surface-sunken/50 px-3 py-1.5 text-sm">
                <span className="flex items-center gap-2 truncate">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {f.filename}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-danger"
                  onClick={async () => {
                    await deleteRequestFile(f.id);
                    onFilesChange(files.filter((x) => x.id !== f.id));
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-3 py-3 text-sm text-muted-foreground hover:bg-surface-sunken">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Click to upload"}
          <input
            type="file"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const selectedFiles = Array.from(e.target.files ?? []);
              if (selectedFiles.length === 0) return;
              setUploading(true);
              try {
                const uploaded: UploadedFile[] = [];
                for (const file of selectedFiles) {
                  const fd = new FormData();
                  fd.set("requestId", requestId);
                  fd.set("assetTypeTag", field.assetTypeTag ?? "other");
                  fd.set("file", file);
                  const result = await uploadRequestFile(fd);
                  uploaded.push(result);
                }
                onFilesChange([...files, ...uploaded]);
                toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded`);
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
    );
  }
  return null;
}

function formatReviewValue(field: WorkflowField, value: unknown, files: UploadedFile[]): string {
  if (field.type === "file-upload") return files.length ? `${files.length} file(s) attached` : "None";
  if (field.type === "boolean") return value ? "Yes" : "No";
  if (field.type === "multiselect") return Array.isArray(value) && value.length ? value.join(", ") : "—";
  if (field.type === "date" && value) return formatDate(String(value));
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export function WorkflowForm({
  requestId,
  typeLabel,
  steps,
  initialValues,
  initialFiles,
}: {
  requestId: string;
  typeLabel: string;
  steps: WorkflowStep[];
  initialValues: Values;
  initialFiles: UploadedFile[];
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Values>(initialValues);
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isReview = stepIndex === steps.length;
  const totalSteps = steps.length + 1;
  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const visibleFieldsByStep = useMemo(
    () => steps.map((step) => step.fields.filter((f) => fieldVisible(f, values))),
    [steps, values]
  );

  function filesFor(tag: string | undefined) {
    return files.filter((f) => f.assetTypeTag === (tag ?? "other"));
  }

  async function persist(nextValues: Values) {
    await saveDraft(requestId, nextValues);
  }

  function handleNext() {
    startTransition(async () => {
      await persist(values);
      setStepIndex((i) => Math.min(i + 1, steps.length));
    });
  }

  function handleBack() {
    startTransition(async () => {
      await persist(values);
      setStepIndex((i) => Math.max(i - 1, 0));
    });
  }

  function handleSaveExit() {
    startTransition(async () => {
      await persist(values);
      toast.success("Draft saved");
      router.push("/requests");
    });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      await persist(values);
      const result = await submitRequest(requestId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>{typeLabel}</span>
          <span>
            {isReview ? "Review" : `Step ${stepIndex + 1} of ${steps.length}`}
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {!isReview ? (
        <div key={steps[stepIndex].key} className="animate-fade-in space-y-6">
          <div>
            <h2 className="font-display text-xl font-medium">{steps[stepIndex].title}</h2>
            {steps[stepIndex].description && <p className="mt-1 text-sm text-muted-foreground">{steps[stepIndex].description}</p>}
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {visibleFieldsByStep[stepIndex].map((field) => (
              <div key={field.key} className={cn("space-y-1.5", field.colSpan === 2 ? "sm:col-span-2" : "")}>
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="ml-0.5 text-danger">*</span>}
                </Label>
                <FieldInput
                  field={field}
                  value={values[field.key]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                  requestId={requestId}
                  files={filesFor(field.assetTypeTag)}
                  onFilesChange={(next) =>
                    setFiles((prev) => [...prev.filter((f) => f.assetTypeTag !== (field.assetTypeTag ?? "other")), ...next])
                  }
                />
                {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          <div>
            <h2 className="font-display text-xl font-medium">Review before submitting</h2>
            <p className="mt-1 text-sm text-muted-foreground">Check the details below, then submit to Marketing.</p>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border">
            {steps.map((step, idx) => (
              <div key={step.key} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">{step.title}</h3>
                  <button type="button" className="text-xs text-accent hover:underline" onClick={() => setStepIndex(idx)}>
                    Edit
                  </button>
                </div>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {step.fields.filter((f) => fieldVisible(f, values)).map((field) => (
                    <div key={field.key} className="flex justify-between gap-3 text-sm sm:block">
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd className="text-right font-medium sm:text-left">{formatReviewValue(field, values[field.key], filesFor(field.assetTypeTag))}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <Button variant="ghost" onClick={handleBack} disabled={pending}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <Button variant="ghost" onClick={handleSaveExit} disabled={pending}>
            Save & exit
          </Button>
        </div>
        {isReview ? (
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Submit to Marketing
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
