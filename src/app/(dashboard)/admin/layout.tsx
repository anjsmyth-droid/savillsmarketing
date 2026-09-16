import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isMarketing, isMarketingAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

async function AdminNav() {
  const user = await getCurrentUser();
  const items = [
    { href: "/admin", label: "Control Centre" },
    { href: "/admin/reporting", label: "Reporting" },
    { href: "/admin/knowledge", label: "Brand & Content Knowledge" },
    ...(user && isMarketingAdmin(user)
      ? [
          { href: "/admin/settings", label: "Settings" },
          { href: "/admin/users", label: "Users & Permissions" },
        ]
      : []),
  ];
  return (
    <nav className="mb-6 flex flex-wrap gap-1 rounded-lg bg-surface-sunken p-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground")}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !isMarketing(user)) redirect("/home");

  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
