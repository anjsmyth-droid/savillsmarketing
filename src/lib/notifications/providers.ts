import { db } from "@/lib/db";
import type { NotificationProvider, NotifyInput } from "./types";

export class InAppNotificationProvider implements NotificationProvider {
  async notify(input: NotifyInput): Promise<void> {
    await db.notification.create({ data: input });
  }
}

/**
 * Stub only — not wired up in the MVP. Demonstrates that adding a delivery
 * channel later is additive: implement NotificationProvider, register it
 * alongside InAppNotificationProvider in index.ts, and this fires
 * whenever an in-app notification does.
 */
export class TeamsNotificationProvider implements NotificationProvider {
  async notify(input: NotifyInput): Promise<void> {
    console.log(`[stub: Microsoft Teams notification] ${input.title}`);
  }
}

export class EmailNotificationProvider implements NotificationProvider {
  async notify(input: NotifyInput): Promise<void> {
    console.log(`[stub: email notification] ${input.title}`);
  }
}
