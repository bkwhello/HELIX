import { describe, it, expect } from "vitest";
import { checkOverrideRules } from "../../domain/rules/OverrideRules.js";
import { managerActor, staffActor } from "../support/factories.js";

// CAP-D01.01-AC18 — Perform an Authorized Override
describe("AC18 — Perform an Authorized Override", () => {
  it("permits an override when the rule allows it, the actor has an authorized role, and a reason is given", () => {
    const violations = checkOverrideRules({
      ruleId: "CAP-D01.01-R11",
      actor: managerActor,
      reason: "Reconstructing a lost telephone booking",
      previousValue: undefined,
      newValue: undefined,
    });
    expect(violations).toHaveLength(0);
  });
});

// CAP-D01.01-AC19 — Reject a Generic or Unpermitted Override
describe("AC19 — Reject a Generic or Unpermitted Override", () => {
  it("rejects an override of a rule that does not permit it", () => {
    const violations = checkOverrideRules({
      ruleId: "CAP-D01.01-R02", // Reservation Identity Is Immutable — override_allowed: false
      actor: managerActor,
      reason: "Because I said so",
      previousValue: undefined,
      newValue: undefined,
    });
    expect(violations.some((v) => v.ruleId === "CAP-D01.01-R39")).toBe(true);
  });

  it("rejects an override attempted by an actor without an authorized role", () => {
    const violations = checkOverrideRules({
      ruleId: "CAP-D01.01-R11",
      actor: staffActor, // role: Reception, not Owner/Manager
      reason: "Please just let me",
      previousValue: undefined,
      newValue: undefined,
    });
    expect(violations.some((v) => v.ruleId === "CAP-D01.01-R40")).toBe(true);
  });

  it("rejects an override with no recorded reason", () => {
    const violations = checkOverrideRules({
      ruleId: "CAP-D01.01-R11",
      actor: managerActor,
      reason: "",
      previousValue: undefined,
      newValue: undefined,
    });
    expect(violations.some((v) => v.ruleId === "CAP-D01.01-R41")).toBe(true);
  });
});
