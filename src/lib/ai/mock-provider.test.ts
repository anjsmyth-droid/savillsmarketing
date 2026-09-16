import { describe, expect, it } from "vitest";
import { MockAIProvider } from "./mock-provider";

const ai = new MockAIProvider();

describe("MockAIProvider", () => {
  it("never invents facts — missing fields are explicitly flagged", async () => {
    const result = await ai.generate<{ suggestedAngle: string }>({
      task: "pr_angle",
      context: { propertyName: "One North Dock" },
    });
    expect(result.data.suggestedAngle).toContain("One North Dock");
    expect(result.data.suggestedAngle).toContain("not supplied");
    expect(result.generatedByAI).toBe(true);
    expect(result.disclaimer.length).toBeGreaterThan(0);
  });

  it("brief_gap_check reports missing required fields", async () => {
    const result = await ai.generate<{ complete: boolean; missing: string[] }>({
      task: "brief_gap_check",
      context: {
        fields: { propertyName: "One North Dock" },
        requiredFields: [
          { key: "propertyName", label: "Property name" },
          { key: "address", label: "Full address" },
        ],
      },
    });
    expect(result.data.complete).toBe(false);
    expect(result.data.missing).toEqual(["Full address"]);
  });

  it("brief_gap_check reports complete when all required fields are present", async () => {
    const result = await ai.generate<{ complete: boolean }>({
      task: "brief_gap_check",
      context: {
        fields: { propertyName: "One North Dock", address: "Dublin 1" },
        requiredFields: [{ key: "propertyName", label: "Property name" }, { key: "address", label: "Full address" }],
      },
    });
    expect(result.data.complete).toBe(true);
  });

  it("brochure sections use only supplied facts", async () => {
    const result = await ai.generate<{ body: string }>({
      task: "brochure_section",
      context: { sectionKey: "sustainability", facts: {} },
    });
    expect(result.data.body).toContain("not supplied");
  });
});
