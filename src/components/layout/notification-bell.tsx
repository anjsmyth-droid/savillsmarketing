"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeTime } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/actions";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
}

export function NotificationBell({ notifications, unreadCount }: { notifications: NotificationItem[]; unreadCount: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => markAllNotificationsRead())}
              className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => !n.read && startTransition(() => markNotificationRead(n.id))}
                className="block rounded-sm px-2 py-2 text-sm hover:bg-surface-sunken"
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                  <div className={n.read ? "pl-3.5" : ""}>
                    <div className="font-medium leading-snug">{n.title}</div>
                    <div className="text-xs text-muted-foreground leading-snug">{n.body}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground/70">{relativeTime(n.createdAt)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
