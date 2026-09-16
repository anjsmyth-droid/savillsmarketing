import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { getCalendarFilterOptions, getCalendarItems } from "@/lib/calendar/queries";
import { MonthGrid } from "@/components/calendar/month-grid";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import { db } from "@/lib/db";

const VIEWS = ["month", "week", "list"] as const;

function parseMonthParam(month?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; division?: string; type?: string; ownerId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const view = VIEWS.includes(params.view as (typeof VIEWS)[number]) ? (params.view as (typeof VIEWS)[number]) : "month";
  const { year, month } = parseMonthParam(params.month);

  let from: Date, to: Date;
  if (view === "week") {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    from = new Date(now);
    from.setDate(now.getDate() - dayOfWeek);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
  } else {
    from = new Date(year, month, 1);
    to = new Date(year, month + 1, 0, 23, 59, 59);
  }

  const [events, filterOptions, departments] = await Promise.all([
    getCalendarItems({ from, to, division: params.division, type: params.type, ownerId: params.ownerId, status: params.status }),
    getCalendarFilterOptions(),
    db.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  function hrefFor(overrides: Record<string, string | undefined>) {
    const merged = { ...params, ...overrides };
    const usp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => v && usp.set(k, v));
    const qs = usp.toString();
    return `/calendar${qs ? `?${qs}` : ""}`;
  }

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Marketing Calendar</h1>
          <p className="mt-1 text-muted-foreground">Every launch, campaign and event in one place.</p>
        </div>
        <nav className="flex gap-1 rounded-lg bg-surface-sunken p-1">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={hrefFor({ view: v })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                view === v ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {view === "month" && (
          <div className="flex items-center gap-2">
            <Link href={hrefFor({ month: monthParam(prevMonth.year, prevMonth.month) })} className="rounded-md border border-border-strong p-1.5 hover:bg-surface-sunken">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="min-w-36 text-center text-sm font-medium">
              {new Date(year, month, 1).toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
            </span>
            <Link href={hrefFor({ month: monthParam(nextMonth.year, nextMonth.month) })} className="rounded-md border border-border-strong p-1.5 hover:bg-surface-sunken">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
        <CalendarFilters divisions={departments.map((d) => d.name)} types={filterOptions.types} owners={filterOptions.owners} />
      </div>

      {view === "month" && <MonthGrid year={year} month={month} events={events} />}

      {(view === "week" || view === "list") && (
        <div className="space-y-2">
          {events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarClock className="h-7 w-7 text-muted-foreground/50" />
                <div className="text-sm text-muted-foreground">Nothing scheduled in this range.</div>
              </CardContent>
            </Card>
          ) : (
            events.map((ev) => {
              const inner = (
                <Card className="flex items-center justify-between px-4 py-3 transition-colors hover:border-accent/40">
                  <div>
                    <div className="font-medium">{ev.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(ev.date)} · {ev.owner?.name ?? "Unassigned"}
                      {ev.property ? ` · ${ev.property.name}` : ""}
                      {ev.campaign ? ` · ${ev.campaign.name}` : ""}
                    </div>
                  </div>
                  <Badge variant="neutral">{ev.type}</Badge>
                </Card>
              );
              return ev.requestId ? (
                <Link key={ev.id} href={`/requests/${ev.requestId}`}>{inner}</Link>
              ) : (
                <div key={ev.id}>{inner}</div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

