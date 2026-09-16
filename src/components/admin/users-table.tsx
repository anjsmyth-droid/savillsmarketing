"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { updateUserRole, toggleUserActive } from "@/lib/admin/users-actions";
import type { RoleName } from "@prisma/client";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  jobTitle: string | null;
  departmentName: string | null;
  avatarColor: string;
  active: boolean;
}

const ROLE_LABEL: Record<RoleName, string> = {
  STANDARD: "Standard User",
  DIVISIONAL: "Divisional User / Director",
  MARKETING: "Marketing",
  MARKETING_ADMIN: "Marketing Admin",
};

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-sunken text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">User</th>
            <th className="px-4 py-2.5 font-medium">Department</th>
            <th className="px-4 py-2.5 font-medium">Role</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.name} color={u.avatarColor} size="sm" />
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.jobTitle ?? u.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{u.departmentName ?? "—"}</td>
              <td className="px-4 py-3">
                <select
                  defaultValue={u.role}
                  disabled={pending}
                  onChange={(e) =>
                    startTransition(async () => {
                      await updateUserRole(u.id, e.target.value as RoleName);
                      toast.success("Role updated");
                    })
                  }
                  className="h-8 rounded-md border border-border-strong bg-surface px-2 text-xs"
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleUserActive(u.id, !u.active);
                      toast.success(u.active ? "User deactivated" : "User activated");
                    })
                  }
                >
                  <Badge variant={u.active ? "success" : "outline"}>{u.active ? "Active" : "Inactive"}</Badge>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
