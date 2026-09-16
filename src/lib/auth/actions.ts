"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEV_SESSION_COOKIE } from "./dev-provider";

/**
 * Development-only: switches the active session to a different dummy user.
 * Must be removed (along with the dev-provider and the switcher UI) before
 * any production deployment — see PRODUCTION_MIGRATION.md.
 */
export async function switchDevUser(formData: FormData) {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;

  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  const redirectTo = formData.get("redirectTo");
  redirect(typeof redirectTo === "string" && redirectTo ? redirectTo : "/home");
}
