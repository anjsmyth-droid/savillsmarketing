"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/status-badge";
import { formatDate, cn } from "@/lib/utils";
import { isOverdue, KANBAN_COLUMNS } from "@/lib/status";
import { changeStatus } from "@/lib/requests/admin-actions";
import type { RequestPriority, RequestStatus } from "@prisma/client";

export interface KanbanCardData {
  id: string;
  title: string;
  requestTypeLabel: string;
  division: string | null;
  requestorName: string;
  marketingOwnerName: string | null;
  marketingOwnerColor: string | null;
  targetDate: string | null;
  priority: RequestPriority;
  confidential: boolean;
  status: RequestStatus;
}

export function KanbanBoard({ initialCards }: { initialCards: KanbanCardData[] }) {
  const [cards, setCards] = useState(initialCards);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const columns = KANBAN_COLUMNS.map((col) => ({
    ...col,
    cards: cards.filter((c) => col.statuses.includes(c.status)),
  }));

  function handleDrop(columnKey: string) {
    if (!dragId) return;
    const column = KANBAN_COLUMNS.find((c) => c.key === columnKey);
    if (!column) return;
    const newStatus = column.statuses[0];
    const card = cards.find((c) => c.id === dragId);
    if (!card || card.status === newStatus) {
      setDragId(null);
      return;
    }
    setCards((prev) => prev.map((c) => (c.id === dragId ? { ...c, status: newStatus } : c)));
    startTransition(async () => {
      try {
        await changeStatus(dragId, newStatus);
        toast.success(`Moved to ${column.label}`);
      } catch {
        toast.error("Could not update status");
        setCards((prev) => prev.map((c) => (c.id === dragId ? { ...c, status: card.status } : c)));
      }
    });
    setDragId(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col.key}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.key)}
          className="flex w-72 shrink-0 flex-col rounded-lg bg-surface-sunken/60"
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <h3 className="text-sm font-medium">{col.label}</h3>
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">{col.cards.length}</span>
          </div>
          <div className="flex-1 space-y-2 px-2 pb-2">
            {col.cards.map((card) => {
              const overdue = isOverdue(card.targetDate ? new Date(card.targetDate) : null, card.status);
              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => setDragId(card.id)}
                  className="cursor-grab space-y-2 rounded-md border border-border bg-surface p-3 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                >
                  <Link href={`/requests/${card.id}`} className="block font-medium leading-snug hover:text-accent">
                    <span className="flex items-start gap-1.5">
                      {card.confidential && <Lock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />}
                      {card.title}
                    </span>
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {card.requestTypeLabel}
                    {card.division ? ` · ${card.division}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">Requested by {card.requestorName}</div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={card.priority} />
                      <span className={cn("text-xs", overdue ? "font-medium text-danger" : "text-muted-foreground")}>
                        {card.targetDate ? formatDate(card.targetDate) : "No date"}
                      </span>
                    </div>
                    {card.marketingOwnerName ? (
                      <Avatar name={card.marketingOwnerName} color={card.marketingOwnerColor ?? undefined} size="sm" />
                    ) : (
                      <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning">Unassigned</span>
                    )}
                  </div>
                </div>
              );
            })}
            {col.cards.length === 0 && (
              <div className="rounded-md border border-dashed border-border-strong py-6 text-center text-xs text-muted-foreground">
                Drop here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
