import Link from "next/link";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { GlobalSearch } from "./global-search";
import { NotificationBell } from "./notification-bell";
import { DevUserSwitcher } from "./dev-user-switcher";
import { MARKETING_NAV, PRIMARY_NAV } from "./nav-items";
import { isMarketing } from "@/lib/auth";

export async function Header({ user }: { user: SessionUser }) {
  const [notifications, unreadCount, allUsers] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.user.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, role: true, jobTitle: true, avatarColor: true },
    }),
  ]);

  const items = isMarketing(user) ? [...PRIMARY_NAV, MARKETING_NAV] : PRIMARY_NAV;

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 md:px-6">
      <div className="flex md:hidden items-center gap-1 overflow-x-auto">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-md p-2 text-foreground/70 hover:bg-surface-sunken">
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </div>
      <div className="flex-1 flex justify-center md:justify-start">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <DevUserSwitcher users={allUsers} currentUserId={user.id} />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border">
          <Avatar name={user.name} color={user.avatarColor} size="sm" />
          <div className="hidden lg:block leading-tight">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-[11px] text-muted-foreground">{user.jobTitle ?? user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
