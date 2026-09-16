import { describe, expect, it } from "vitest";
import { fieldVisible } from "./visibility";
import type { WorkflowField } from "./types";

const baseField: WorkflowField = { key: "quotePerson", label: "Who should be quoted?", type: "text" };

describe("fieldVisible", () => {
  it("is visible with no condition", () => {
    expect(fieldVisible(baseField, {})).toBe(true);
  });

  it("respects truthy conditions", () => {
    const field: WorkflowField = { ...baseField, showIf: { field: "quoteRequired", truthy: true } };
    expect(fieldVisible(field, { quoteRequired: true })).toBe(true);
    expect(fieldVisible(field, { quoteRequired: false })).toBe(false);
    expect(fieldVisible(field, {})).toBe(false);
  });

  it("respects equals conditions", () => {
    const field: WorkflowField = { ...baseField, showIf: { field: "printOrDigital", equals: "Print" } };
    expect(fieldVisible(field, { printOrDigital: "Print" })).toBe(true);
    expect(fieldVisible(field, { printOrDigital: "Digital" })).toBe(false);
  });

  it("respects in conditions", () => {
    const field: WorkflowField = { ...baseField, showIf: { field: "whatsHappening", in: ["Property for sale", "New instruction"] } };
    expect(fieldVisible(field, { whatsHappening: "New instruction" })).toBe(true);
    expect(fieldVisible(field, { whatsHappening: "Property to let" })).toBe(false);
  });
});
