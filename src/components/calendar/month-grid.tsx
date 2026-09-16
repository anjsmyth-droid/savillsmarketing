import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CalendarEventItem {
  id: string;
  title: string;
  type: string;
  date: Date;
  status: string;
  requestId: string | null;
}

const TYPE_COLOR: Record<string, string> = {
  "PR Launch": "bg-info-soft text-info",
  Research: "bg-primary/10 text-primary",
  Event: "bg-accent-soft text-accent-foreground",
  Social: "bg-success-soft text-success",
  "E-Campaign": "bg-warning-soft text-warning",
  "Property Launch": "bg-danger-soft text-danger",
  Sponsorship: "bg-surface-sunken text-foreground",
  Internal: "bg-surface-sunken text-foreground",
  "Thought Leadership": "bg-info-soft text-info",
};

function eventClass(type: string) {
  return TYPE_COLOR[type] ?? "bg-surface-sunken text-foreground";
}

export function MonthGrid({ year, month, events }: { year: number; month: number; events: CalendarEventItem[] }) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const gridStart = new Date(year, month, 1 - startOffset);

  const days: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const eventsByDay = new Map<string, CalendarEventItem[]>();
  for (const ev of events) {
    const key = ev.date.toDateString();
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(ev);
  }

  const today = new Date().toDateString();

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 bg-surface-sunken text-xs font-medium text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-3 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = day.getMonth() === month;
          const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-28 border-b border-r border-border p-1.5",
                (i + 1) % 7 === 0 && "border-r-0",
                !inMonth && "bg-surface-sunken/40"
              )}
            >
              <div className={cn("mb-1 text-xs", day.toDateString() === today ? "font-semibold text-accent" : "text-muted-foreground", !inMonth && "opacity-50")}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((ev) => {
                  const content = (
                    <span className={cn("block truncate rounded px-1.5 py-0.5 text-[11px] font-medium", eventClass(ev.type))}>
                      {ev.title}
                    </span>
                  );
                  return ev.requestId ? (
                    <Link key={ev.id} href={`/requests/${ev.requestId}`}>{content}</Link>
                  ) : (
                    <div key={ev.id}>{content}</div>
                  );
                })}
                {dayEvents.length > 3 && <div className="text-[11px] text-muted-foreground">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
