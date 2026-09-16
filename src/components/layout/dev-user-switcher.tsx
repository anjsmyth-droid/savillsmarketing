"use client";

import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { switchDevUser } from "@/lib/auth/actions";

interface SwitcherUser {
  id: string;
  name: string;
  role: string;
  jobTitle: string | null;
  avatarColor: string;
}

const ROLE_LABEL: Record<string, string> = {
  STANDARD: "Standard User",
  DIVISIONAL: "Divisional Director",
  MARKETING: "Marketing",
  MARKETING_ADMIN: "Marketing Admin",
};

export function DevUserSwitcher({ users, currentUserId }: { users: SwitcherUser[]; currentUserId: string }) {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md border border-dashed border-accent/50 bg-accent-soft px-2.5 py-1.5 text-xs font-medium text-accent-foreground hover:brightness-95">
          <FlaskConical className="h-3.5 w-3.5" />
          Dev: view as
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          Development role switcher
          <div className="mt-0.5 font-normal text-muted-foreground">Not part of the production app — instantly preview any user&apos;s experience.</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((u) => (
          <form key={u.id} action={switchDevUser}>
            <input type="hidden" name="userId" value={u.id} />
            <input type="hidden" name="redirectTo" value={pathname} />
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <Avatar name={u.name} color={u.avatarColor} size="sm" />
                <span className="flex-1 text-left">
                  <span className="block font-medium">{u.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {ROLE_LABEL[u.role] ?? u.role}
                    {u.jobTitle ? ` · ${u.jobTitle}` : ""}
                  </span>
                </span>
                {u.id === currentUserId && <span className="text-xs text-accent">Active</span>}
              </button>
            </DropdownMenuItem>
          </form>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
