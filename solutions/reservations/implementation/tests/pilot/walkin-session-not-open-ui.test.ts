import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyWalkInMessage,
  WALKIN_OUTSIDE_BOOKING_WINDOW_MESSAGE,
  WALKIN_SESSION_NOT_OPEN_MESSAGE,
  WALKIN_SUCCESS_SEATED_MESSAGE,
  WALKIN_SUCCESS_UNSEATED_MESSAGE,
} from "../e2e/support/walkInOutcome.js";

/**
 * R1.5-P7-C1 — (1) the Walk-in form now shows a clear Dutch message for the
 * server's 409 SESSION_NOT_OPEN instead of "Onbekende fout."; (2) the
 * walkin-auth E2E outcome classifier can no longer mistake the failure text
 * "Walk-in niet geregistreerd: …" for success, and only the two known
 * environment prerequisites may skip.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let walkInSubmit: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8").replace(/\r\n/g, "\n");
  const start = source.indexOf('walkinForm.addEventListener("submit"');
  expect(start).toBeGreaterThan(-1);
  walkInSubmit = source.slice(start, source.indexOf("walkinForm.reset();", start));
});

describe("A — SESSION_NOT_OPEN maps to the exact Dutch operational message", () => {
  it("defines the exact message and shows it, unprefixed, for 409 SESSION_NOT_OPEN", () => {
    expect(source).toContain('const WALKIN_SESSION_NOT_OPEN_MESSAGE = "Walk-in kan niet worden geregistreerd: er is geen geopende dienst.";');
    expect(walkInSubmit).toContain('if (res.status === 409 && data.type === "SESSION_NOT_OPEN") {');
    expect(walkInSubmit).toContain('showMessage(walkinMessage, WALKIN_SESSION_NOT_OPEN_MESSAGE, "error");');
  });

  it("is handled BEFORE the generic failure branch (which would render 'Onbekende fout.')", () => {
    const sessionBranch = walkInSubmit.indexOf('if (res.status === 409 && data.type === "SESSION_NOT_OPEN") {');
    const genericBranch = walkInSubmit.indexOf('showMessage(walkinMessage, "Walk-in niet geregistreerd:\\n" + walkInErrorMessage(data), "error");');
    expect(sessionBranch).toBeGreaterThan(-1);
    expect(genericBranch).toBeGreaterThan(sessionBranch);
  });

  it("the E2E classifier's expected texts are exactly what pilot.html renders (no drift)", () => {
    expect(WALKIN_SESSION_NOT_OPEN_MESSAGE).toBe("Walk-in kan niet worden geregistreerd: er is geen geopende dienst.");
    expect(source).toContain(`showMessage(walkinMessage, "${WALKIN_SUCCESS_SEATED_MESSAGE}", "ok");`);
    expect(source).toContain(`"${WALKIN_SUCCESS_UNSEATED_MESSAGE}",\n          "warn"`);
    // Outside-window text = generic prefix + creationErrorMessage's servicePeriod text.
    expect(source).toContain('"Walk-in niet geregistreerd:\\n" + walkInErrorMessage(data)');
    expect(source).toContain('"Buiten de reserveringstijden."');
    expect(WALKIN_OUTSIDE_BOOKING_WINDOW_MESSAGE).toBe("Walk-in niet geregistreerd:\nBuiten de reserveringstijden.");
  });
});

describe("B — the success check can NOT match 'Walk-in niet geregistreerd'", () => {
  it("the old regex did match the failure text (the defect being fixed)", () => {
    expect("Walk-in niet geregistreerd:\nOnbekende fout.").toMatch(/geregistreerd/);
  });

  it("every 'niet geregistreerd' failure text classifies as FAILURE, never SUCCESS", () => {
    for (const reason of ["Onbekende fout.", "Geen capaciteit beschikbaar voor deze walk-in.", "Gesloten op deze datum/tijd."]) {
      for (const cls of ["message error", "message ok", "message warn"]) {
        expect(classifyWalkInMessage(`Walk-in niet geregistreerd:\n${reason}`, cls)).toBe("FAILURE");
      }
    }
  });
});

describe("C — a real success still classifies as SUCCESS (exact text + exact class)", () => {
  it("seated and unseated success", () => {
    expect(classifyWalkInMessage(WALKIN_SUCCESS_SEATED_MESSAGE, "message ok")).toBe("SUCCESS");
    expect(classifyWalkInMessage(WALKIN_SUCCESS_UNSEATED_MESSAGE, "message warn")).toBe("SUCCESS");
  });
});

describe("D — unexpected results stay FAILURES; only the two known prerequisites skip", () => {
  it("the two environment prerequisites are the only skips", () => {
    expect(classifyWalkInMessage(WALKIN_SESSION_NOT_OPEN_MESSAGE, "message error")).toBe("SKIP_NO_OPENED_SESSION");
    expect(classifyWalkInMessage(WALKIN_OUTSIDE_BOOKING_WINDOW_MESSAGE, "message error")).toBe("SKIP_OUTSIDE_BOOKING_WINDOW");
  });

  it("unknown error, permission, re-login, empty, or wrong class are FAILURE (never a skip, never success)", () => {
    expect(classifyWalkInMessage("Walk-in niet geregistreerd:\nOnbekende fout.", "message error")).toBe("FAILURE");
    expect(classifyWalkInMessage("Je hebt geen rechten om een walk-in te registreren.", "message error")).toBe("FAILURE");
    expect(classifyWalkInMessage("", "")).toBe("FAILURE");
    expect(classifyWalkInMessage(WALKIN_SUCCESS_SEATED_MESSAGE, "message error")).toBe("FAILURE");
    expect(classifyWalkInMessage(WALKIN_SUCCESS_SEATED_MESSAGE, "")).toBe("FAILURE");
    expect(classifyWalkInMessage(WALKIN_SESSION_NOT_OPEN_MESSAGE, "message ok")).toBe("FAILURE");
    expect(classifyWalkInMessage(`${WALKIN_SESSION_NOT_OPEN_MESSAGE} extra`, "message error")).toBe("FAILURE");
  });
});
