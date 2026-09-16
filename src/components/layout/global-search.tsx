"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/library?q=${encodeURIComponent(q.trim())}`);
      }}
      className="hidden sm:flex items-center gap-2 rounded-md border border-border-strong bg-surface-sunken/60 px-3 py-1.5 w-72 focus-within:ring-2 focus-within:ring-[var(--ring)] transition-shadow"
    >
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the Marketing Library…"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
      />
    </form>
  );
}
