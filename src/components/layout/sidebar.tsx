"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MARKETING_NAV, PRIMARY_NAV } from "./nav-items";

export function Sidebar({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const items = showAdmin ? [...PRIMARY_NAV, MARKETING_NAV] : PRIMARY_NAV;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-sm font-semibold text-primary-foreground">
          S
        </div>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-medium tracking-tight">Marketing Hub</div>
          <div className="text-[11px] text-muted-foreground">Savills Intel</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/75 hover:bg-surface-sunken hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 text-[11px] leading-relaxed text-muted-foreground">
        Marketing Hub MVP
        <br />
        Local development build
      </div>
    </aside>
  );
}
