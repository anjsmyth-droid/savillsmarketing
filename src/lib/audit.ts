import { db } from "@/lib/db";

export type AuditAction =
  | "request.created"
  | "request.submitted"
  | "request.assigned"
  | "request.status_changed"
  | "request.priority_changed"
  | "request.completed"
  | "file.uploaded"
  | "file.deleted"
  | "content.generated"
  | "content.approved"
  | "approval.requested"
  | "approval.decided"
  | "comment.added"
  | "permission.changed"
  | "asset.metadata_updated";

export async function recordAudit(input: {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}
