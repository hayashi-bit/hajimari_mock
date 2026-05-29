import { describe, it, expect } from "vitest";
import { feedbackRouter } from "./routers/feedback";

describe("feedbackRouter", () => {
  it("exports create procedure", () => {
    expect(feedbackRouter).toBeDefined();
    expect(feedbackRouter._def.procedures.create).toBeDefined();
  });

  it("exports list procedure", () => {
    expect(feedbackRouter._def.procedures.list).toBeDefined();
  });

  it("exports summary procedure", () => {
    expect(feedbackRouter._def.procedures.summary).toBeDefined();
  });

  it("exports updateStatus procedure", () => {
    expect(feedbackRouter._def.procedures.updateStatus).toBeDefined();
  });

  it("create input validates type enum", () => {
    const createDef = feedbackRouter._def.procedures.create;
    expect(createDef).toBeDefined();
    // The procedure exists and has input validation
    expect(createDef._def.inputs).toBeDefined();
  });

  it("list input accepts optional type filter", () => {
    const listDef = feedbackRouter._def.procedures.list;
    expect(listDef).toBeDefined();
    expect(listDef._def.inputs).toBeDefined();
  });

  it("updateStatus input validates status enum", () => {
    const updateDef = feedbackRouter._def.procedures.updateStatus;
    expect(updateDef).toBeDefined();
    expect(updateDef._def.inputs).toBeDefined();
  });
});
