import type { RequestPriority, RequestStatus } from "@prisma/client";

export const STATUS_ORDER: RequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "BRIEF_REVIEW",
  "IN_PROGRESS",
  "DRAFT_READY",
  "AWAITING_REQUESTOR",
  "AWAITING_APPROVAL",
  "SCHEDULED",
  "COMPLETE",
];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  BRIEF_REVIEW: "Brief Review",
  IN_PROGRESS: "In Progress",
  DRAFT_READY: "Draft Ready",
  AWAITING_REQUESTOR: "Awaiting You",
  AWAITING_APPROVAL: "Awaiting Approval",
  SCHEDULED: "Scheduled",
  COMPLETE: "Complete",
};

export const STATUS_BADGE_VARIANT: Record<RequestStatus, "neutral" | "primary" | "accent" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  BRIEF_REVIEW: "info",
  IN_PROGRESS: "primary",
  DRAFT_READY: "accent",
  AWAITING_REQUESTOR: "warning",
  AWAITING_APPROVAL: "warning",
  SCHEDULED: "success",
  COMPLETE: "success",
};

// Kanban columns group a couple of adjacent statuses (spec §19).
export const KANBAN_COLUMNS: { key: string; label: string; statuses: RequestStatus[] }[] = [
  { key: "new", label: "New", statuses: ["SUBMITTED"] },
  { key: "reviewing", label: "Reviewing", statuses: ["BRIEF_REVIEW"] },
  { key: "in_production", label: "In Production", statuses: ["IN_PROGRESS", "DRAFT_READY"] },
  { key: "awaiting_business", label: "Awaiting Business", statuses: ["AWAITING_REQUESTOR"] },
  { key: "awaiting_approval", label: "Awaiting Approval", statuses: ["AWAITING_APPROVAL"] },
  { key: "scheduled", label: "Scheduled", statuses: ["SCHEDULED"] },
  { key: "complete", label: "Complete", statuses: ["COMPLETE"] },
];

export function statusProgressPercent(status: RequestStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return Math.round((idx / (STATUS_ORDER.length - 1)) * 100);
}

export const PRIORITY_LABEL: Record<RequestPriority, string> = {
  NORMAL: "Normal",
  IMPORTANT: "Important",
  URGENT: "Urgent",
};

export const PRIORITY_BADGE_VARIANT: Record<RequestPriority, "neutral" | "warning" | "danger"> = {
  NORMAL: "neutral",
  IMPORTANT: "warning",
  URGENT: "danger",
};

export function isAwaitingRequestor(status: RequestStatus): boolean {
  return status === "AWAITING_REQUESTOR";
}

export function isOverdue(targetDate: Date | null, status: RequestStatus): boolean {
  if (!targetDate) return false;
  if (status === "COMPLETE") return false;
  return targetDate.getTime() < Date.now();
}
