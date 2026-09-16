"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Option {
  value: string;
  label: string;
}

function FilterSelect({ param, label, options }: { param: string; label: string; options: Option[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      defaultValue={searchParams.get(param) ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set(param, e.target.value);
        else params.delete(param);
        router.push(`/calendar?${params.toString()}`);
      }}
      className="h-9 rounded-md border border-border-strong bg-surface px-2.5 text-sm"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function CalendarFilters({
  divisions,
  types,
  owners,
}: {
  divisions: string[];
  types: string[];
  owners: { id: string; name: string }[];
}) {
  return (
    <div className="ml-auto flex flex-wrap gap-2">
      <FilterSelect param="division" label="All divisions" options={divisions.map((d) => ({ value: d, label: d }))} />
      <FilterSelect param="type" label="All types" options={types.map((t) => ({ value: t, label: t }))} />
      <FilterSelect param="ownerId" label="All owners" options={owners.map((o) => ({ value: o.id, label: o.name }))} />
    </div>
  );
}
