import { describe, it, expect } from "vitest";
import { validateEvent } from "@/lib/store";

const base = { name: "W", type: "Workshop", date: "2026-11-01", location: "X", attendees: 50, budget: 1000, status: "Planning" as const };

describe("validateEvent", () => {
  it("accepts a valid future event", () => {
    expect(validateEvent(base, "2026-10-14")).toEqual({});
  });
  it("rejects past dates", () => {
    expect(validateEvent({ ...base, date: "2026-10-01" }, "2026-10-14").date).toBeDefined();
  });
  it("requires a name", () => {
    expect(validateEvent({ ...base, name: " " }, "2026-10-14").name).toBeDefined();
  });
  it("rejects negative budget", () => {
    expect(validateEvent({ ...base, budget: -5 }, "2026-10-14").budget).toBeDefined();
  });
});
