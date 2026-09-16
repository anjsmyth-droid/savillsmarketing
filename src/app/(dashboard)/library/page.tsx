import Link from "next/link";
import { Search, FolderSearch } from "lucide-react";
import { requireUser, isMarketing } from "@/lib/auth";
import { searchAssets } from "@/lib/library/queries";
import { LIBRARY_CATEGORIES } from "@/lib/library/constants";
import { AssetCard } from "@/components/library/asset-card";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; year?: string; serviceLine?: string }>;
}) {
  const { q, category, year, serviceLine } = await searchParams;
  const user = await requireUser();
  const marketing = isMarketing(user);

  const assets = await searchAssets(user, { q, category, year: year ? Number(year) : undefined, serviceLine });

  const years = Array.from(new Set(assets.map((a) => a.year))).sort((a, b) => b - a);

  function hrefFor(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q, category, year, serviceLine, ...overrides };
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, v));
    const qs = params.toString();
    return `/library${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Marketing Library</h1>
        <p className="mt-1 text-muted-foreground">Every asset the team has produced — searchable, not filed away.</p>
      </div>

      <form action="/library" className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 py-3 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q}
          placeholder="What are you looking for? Try a property, campaign, or person…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        {category && <input type="hidden" name="category" value={category} />}
        {year && <input type="hidden" name="year" value={year} />}
        {serviceLine && <input type="hidden" name="serviceLine" value={serviceLine} />}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={hrefFor({ category: undefined })} className={cn("rounded-full border px-3 py-1 text-xs font-medium", !category ? "border-primary bg-primary/10 text-primary" : "border-border-strong text-muted-foreground hover:bg-surface-sunken")}>
          All
        </Link>
        {LIBRARY_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={hrefFor({ category: c })}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium", category === c ? "border-primary bg-primary/10 text-primary" : "border-border-strong text-muted-foreground hover:bg-surface-sunken")}
          >
            {c}
          </Link>
        ))}
        {years.length > 0 && (
          <span className="ml-2 flex items-center gap-1 border-l border-border pl-3">
            {years.map((y) => (
              <Link
                key={y}
                href={hrefFor({ year: year === String(y) ? undefined : String(y) })}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium", year === String(y) ? "border-primary bg-primary/10 text-primary" : "border-border-strong text-muted-foreground hover:bg-surface-sunken")}
              >
                {y}
              </Link>
            ))}
          </span>
        )}
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FolderSearch className="h-8 w-8 text-muted-foreground/50" />
            <div className="font-medium">No matching assets</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Assets are added automatically whenever files are uploaded to a request. Try a broader search or a different category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((a) => (
            <AssetCard
              key={a.id}
              canEdit={marketing}
              asset={{
                id: a.id,
                fileId: a.fileId,
                title: a.title,
                category: a.category,
                confidentiality: a.confidentiality,
                year: a.year,
                mimeType: a.file.mimeType,
                propertyName: a.property?.name ?? null,
                clientName: a.clientName,
                serviceLine: a.serviceLine,
                createdAt: a.createdAt.toISOString(),
                tags: a.tags.map((t) => t.tag),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
