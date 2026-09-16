import type { RoleName } from "@prisma/client";

// Shape the rest of the app depends on. Any production AuthProvider
// (e.g. Entra ID) only needs to resolve to this shape — nothing else in
// the app should read cookies or session internals directly.
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  initials: string;
  avatarColor: string;
  jobTitle: string | null;
  departmentId: string | null;
  departmentName: string | null;
}

export interface AuthProvider {
  /** Resolves the current request's authenticated user, or null if signed out. */
  getCurrentUser(): Promise<SessionUser | null>;
}
