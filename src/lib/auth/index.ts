import { cache } from "react";
import { DevAuthProvider } from "./dev-provider";
import type { AuthProvider, SessionUser } from "./types";

export type { SessionUser } from "./types";

// Provider selection is env-driven. Only "dev" exists today; a production
// build would add an EntraIdAuthProvider implementing the same interface
// and switch on AUTH_PROVIDER=entra here — no other file changes.
function createAuthProvider(): AuthProvider {
  const provider = process.env.AUTH_PROVIDER ?? "dev";
  switch (provider) {
    case "dev":
    default:
      return new DevAuthProvider();
  }
}

const authProvider = createAuthProvider();

// Cached per-request so multiple server components reading the session
// don't each hit the database.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  return authProvider.getCurrentUser();
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export function isMarketing(user: Pick<SessionUser, "role">): boolean {
  return user.role === "MARKETING" || user.role === "MARKETING_ADMIN";
}

export function isMarketingAdmin(user: Pick<SessionUser, "role">): boolean {
  return user.role === "MARKETING_ADMIN";
}

export async function requireMarketing(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isMarketing(user)) {
    throw new Error("Forbidden: Marketing role required");
  }
  return user;
}

export async function requireMarketingAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isMarketingAdmin(user)) {
    throw new Error("Forbidden: Marketing Admin role required");
  }
  return user;
}
