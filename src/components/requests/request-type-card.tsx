import { DynamicIcon } from "@/components/dynamic-icon";
import { startDraft } from "@/lib/requests/actions";
import { cn } from "@/lib/utils";

export function RequestTypeCard({
  typeKey,
  label,
  description,
  icon,
  compact,
}: {
  typeKey: string;
  label: string;
  description: string;
  icon: string;
  compact?: boolean;
}) {
  return (
    <form action={startDraft}>
      <input type="hidden" name="typeKey" value={typeKey} />
      <button
        type="submit"
        className={cn(
          "group flex w-full flex-col items-start gap-3 rounded-lg border border-border bg-surface text-left transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md",
          compact ? "p-4" : "p-5"
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
          <DynamicIcon name={icon} className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-display text-[15px] font-medium leading-snug">{label}</span>
          {!compact && <span className="mt-1 block text-sm text-muted-foreground leading-snug">{description}</span>}
        </span>
      </button>
    </form>
  );
}
