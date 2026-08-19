import { describe, it, expect } from "vitest";
import { evaluateTeppanyakiSelfServicePacing, TEPPANYAKI_SELF_SERVICE_CEILING } from "../../domain/availability/TeppanyakiSelfServicePacing.js";

/** Pure-function unit tests, mirroring tests/domain/booking-policy.test.ts's own style — no database. */
describe("evaluateTeppanyakiSelfServicePacing", () => {
  it("the ceiling constant is 32", () => {
    expect(TEPPANYAKI_SELF_SERVICE_CEILING).toBe(32);
  });

  it("ALLOWED at exactly the ceiling for self-service Teppanyaki", () => {
    const result = evaluateTeppanyakiSelfServicePacing({ capacityPoolId: "Teppanyaki", isStaffActor: false, projectedOccupancy: 32 });
    expect(result.type).toBe("ALLOWED");
  });

  it("ROUTE_TO_STAFF one over the ceiling for self-service Teppanyaki", () => {
    const result = evaluateTeppanyakiSelfServicePacing({ capacityPoolId: "Teppanyaki", isStaffActor: false, projectedOccupancy: 33 });
    expect(result.type).toBe("ROUTE_TO_STAFF");
  });

  it("staff are exempt even far past the ceiling", () => {
    const result = evaluateTeppanyakiSelfServicePacing({ capacityPoolId: "Teppanyaki", isStaffActor: true, projectedOccupancy: 40 });
    expect(result.type).toBe("ALLOWED");
  });

  it("never applies to Sushi, even for self-service, even far past what 80% of Sushi capacity would be", () => {
    const result = evaluateTeppanyakiSelfServicePacing({ capacityPoolId: "Sushi", isStaffActor: false, projectedOccupancy: 49 });
    expect(result.type).toBe("ALLOWED");
  });

  it("ROUTE_TO_STAFF carries a distinguishable reason string (never the generic party-size-routing text)", () => {
    const result = evaluateTeppanyakiSelfServicePacing({ capacityPoolId: "Teppanyaki", isStaffActor: false, projectedOccupancy: 40 });
    expect(result.type).toBe("ROUTE_TO_STAFF");
    if (result.type === "ROUTE_TO_STAFF") {
      expect(result.reason).toContain("pacing ceiling");
      expect(result.reason).not.toContain("self-service range");
    }
  });
});
