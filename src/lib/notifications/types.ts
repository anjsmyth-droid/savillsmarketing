export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

// The in-app notification centre is the real MVP delivery channel. Email
// and Microsoft Teams are architected as the same interface so they can be
// added later as additional (not replacement) providers — see
// EmailNotificationProvider / TeamsNotificationProvider stubs below.
export interface NotificationProvider {
  notify(input: NotifyInput): Promise<void>;
}
