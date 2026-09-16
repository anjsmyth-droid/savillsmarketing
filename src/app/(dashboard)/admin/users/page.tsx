import { redirect } from "next/navigation";
import { getCurrentUser, isMarketingAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || !isMarketingAdmin(user)) redirect("/admin");

  const users = await db.user.findMany({ include: { department: true }, orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Users & Permissions</h1>
        <p className="mt-1 text-muted-foreground">
          Manage roles for the {users.length} dummy users seeded in this environment. In production this would be
          driven by Entra ID group membership rather than managed here.
        </p>
      </div>
      <UsersTable
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          jobTitle: u.jobTitle,
          departmentName: u.department?.name ?? null,
          avatarColor: u.avatarColor,
          active: u.active,
        }))}
      />
    </div>
  );
}
