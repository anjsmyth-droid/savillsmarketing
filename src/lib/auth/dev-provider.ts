import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { AuthProvider, SessionUser } from "./types";

export const DEV_SESSION_COOKIE = "smh_dev_user_id";

/**
 * MVP-only auth provider. There is no password/SSO flow: the "signed in"
 * user is whichever id is stored in a plain cookie, switchable at any time
 * via the dev role switcher (see components/layout/dev-user-switcher.tsx).
 *
 * This exists ONLY so the app is demoable without Entra ID wired up. It
 * implements the same AuthProvider interface a real SSO integration would,
 * so replacing it is a matter of swapping the provider in index.ts — no
 * caller elsewhere in the app changes.
 */
export class DevAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    let userId = cookieStore.get(DEV_SESSION_COOKIE)?.value;

    if (!userId) {
      const fallback = await db.user.findFirst({
        where: { active: true },
        orderBy: { createdAt: "asc" },
      });
      userId = fallback?.id;
    }

    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });
    if (!user || !user.active) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      initials: user.initials,
      avatarColor: user.avatarColor,
      jobTitle: user.jobTitle,
      departmentId: user.departmentId,
      departmentName: user.department?.name ?? null,
    };
  }
}
