import type { LucideIcon } from "lucide-react";
import { CalendarDays, FolderSearch, Home, LayoutDashboard, ListChecks, PlusCircle } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/requests", label: "Requests", icon: ListChecks },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/library", label: "Library", icon: FolderSearch },
];

export const MARKETING_NAV: NavItem = { href: "/admin", label: "Admin", icon: LayoutDashboard };
