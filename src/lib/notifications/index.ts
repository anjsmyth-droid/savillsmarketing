import { InAppNotificationProvider } from "./providers";
import type { NotificationProvider, NotifyInput } from "./types";

export type { NotifyInput } from "./types";

const providers: NotificationProvider[] = [new InAppNotificationProvider()];

export async function notify(input: NotifyInput): Promise<void> {
  await Promise.all(providers.map((p) => p.notify(input)));
}

export async function notifyMany(userIds: string[], input: Omit<NotifyInput, "userId">): Promise<void> {
  await Promise.all(userIds.map((userId) => notify({ ...input, userId })));
}
