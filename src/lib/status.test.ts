import { describe, expect, it } from "vitest";
import { isOverdue, statusProgressPercent } from "./status";

describe("statusProgressPercent", () => {
  it("is 0 for DRAFT and 100 for COMPLETE", () => {
    expect(statusProgressPercent("DRAFT")).toBe(0);
    expect(statusProgressPercent("COMPLETE")).toBe(100);
  });

  it("increases monotonically through the workflow", () => {
    expect(statusProgressPercent("SUBMITTED")).toBeLessThan(statusProgressPercent("IN_PROGRESS"));
    expect(statusProgressPercent("IN_PROGRESS")).toBeLessThan(statusProgressPercent("SCHEDULED"));
  });
});

describe("isOverdue", () => {
  it("is false when there is no target date", () => {
    expect(isOverdue(null, "IN_PROGRESS")).toBe(false);
  });

  it("is false once the request is complete, even if the date has passed", () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(isOverdue(yesterday, "COMPLETE")).toBe(false);
  });

  it("is true when the target date has passed and the request is still open", () => {
    const yesterday = new Date(Date.now() - 86400000);
    expect(isOverdue(yesterday, "IN_PROGRESS")).toBe(true);
  });

  it("is false when the target date is in the future", () => {
    const tomorrow = new Date(Date.now() + 86400000);
    expect(isOverdue(tomorrow, "IN_PROGRESS")).toBe(false);
  });
});
