import type { FieldCondition, WorkflowField } from "./types";

export function conditionMet(condition: FieldCondition, values: Record<string, unknown>): boolean {
  const current = values[condition.field];
  if (condition.truthy !== undefined) return condition.truthy ? !!current : !current;
  if (condition.equals !== undefined) return current === condition.equals;
  if (condition.in) return typeof current === "string" && condition.in.includes(current);
  return true;
}

export function fieldVisible(field: WorkflowField, values: Record<string, unknown>): boolean {
  if (!field.showIf) return true;
  return conditionMet(field.showIf, values);
}
