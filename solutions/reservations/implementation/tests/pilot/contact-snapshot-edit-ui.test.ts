import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.3-I2 — "correcting the contact phone/email snapshot" pilot UI
 * regression coverage. Same posture as the other pilot test files: plain
 * source-text assertion against the shipped file (no DOM/browser runner
 * in this codebase). tests/api/reservations.test.ts already exhaustively
 * proves the server contract; this file's only job is proving
 * pilot.html's existing edit workflow (enterEditMode/exitEditMode/
 * createForm's submit handler) wires up to it correctly — no new editor,
 * no redesign, two fields added to the already-existing form.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let enterEditModeBlock: string;
let exitEditModeBlock: string;
let submitHandlerBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const enterStart = source.indexOf("function enterEditMode(r) {");
  const enterEnd = source.indexOf("function exitEditMode() {");
  expect(enterStart).toBeGreaterThan(-1);
  expect(enterEnd).toBeGreaterThan(enterStart);
  enterEditModeBlock = source.slice(enterStart, enterEnd);

  const exitStart = enterEnd;
  const exitEnd = source.indexOf("cancelEditButton.addEventListener");
  expect(exitEnd).toBeGreaterThan(exitStart);
  exitEditModeBlock = source.slice(exitStart, exitEnd);

  const submitStart = source.indexOf('createForm.addEventListener("submit"');
  const submitEnd = source.indexOf("// CAP-D05.01 §13", submitStart);
  expect(submitStart).toBeGreaterThan(-1);
  expect(submitEnd).toBeGreaterThan(submitStart);
  submitHandlerBlock = source.slice(submitStart, submitEnd);
});

describe("Contact snapshot correction — form markup", () => {
  it("has phone/email snapshot inputs, hidden by default (not part of the ordinary create form)", () => {
    expect(source).toContain('id="contact-snapshot-row" style="display:none;"');
    expect(source).toContain('id="contact-phone-snapshot"');
    expect(source).toContain('id="contact-email-snapshot"');
  });

  it("is clearly labeled as the reservation's own recorded snapshot, distinct from guest-phone/guest-email", () => {
    expect(source).toContain("Telefoon (zoals vastgelegd bij deze reservering)");
    expect(source).toContain("E-mail (zoals vastgelegd bij deze reservering)");
  });
});

describe("enterEditMode — populates and reveals the snapshot fields", () => {
  it("populates both fields from the reservation's own contactPhoneSnapshot/contactEmailSnapshot, never guest-phone/guest-email's values", () => {
    expect(enterEditModeBlock).toContain('document.getElementById("contact-phone-snapshot").value = r.contactPhoneSnapshot || "";');
    expect(enterEditModeBlock).toContain('document.getElementById("contact-email-snapshot").value = r.contactEmailSnapshot || "";');
  });

  it("reveals the snapshot row when entering edit mode", () => {
    expect(enterEditModeBlock).toContain('document.getElementById("contact-snapshot-row").style.display = "";');
  });
});

describe("exitEditMode — hides the snapshot row again", () => {
  it("hides the snapshot row on exiting edit mode, so it never shows during ordinary Create", () => {
    expect(exitEditModeBlock).toContain('document.getElementById("contact-snapshot-row").style.display = "none";');
  });
});

describe("Submit handler — PATCH contract (edit branch only)", () => {
  it("includes contactPhoneSnapshot/contactEmailSnapshot in the PATCH changes object, using the same blank-means-unchanged convention as notes/preferredArea", () => {
    expect(submitHandlerBlock).toContain('contactPhoneSnapshot: document.getElementById("contact-phone-snapshot").value.trim() || undefined,');
    expect(submitHandlerBlock).toContain('contactEmailSnapshot: document.getElementById("contact-email-snapshot").value.trim() || undefined,');
  });

  it("the fields are sent only inside the PATCH (editingReservationId) branch, never inside the plain create POST body", () => {
    const editBranchStart = submitHandlerBlock.indexOf("if (editingReservationId) {");
    const editBranchEnd = submitHandlerBlock.indexOf("\n      }\n\n      // CAP-D05.01");
    expect(editBranchStart).toBeGreaterThan(-1);
    const createBranchOnward = editBranchEnd > -1 ? submitHandlerBlock.slice(editBranchEnd) : submitHandlerBlock.slice(submitHandlerBlock.indexOf("const contactSelection"));
    expect(createBranchOnward).not.toMatch(/contactPhoneSnapshot|contactEmailSnapshot/);
  });

  it("still posts to the same authoritative PATCH /availability/reservations/:id endpoint, no new route", () => {
    expect(submitHandlerBlock).toContain("fetch(`/availability/reservations/${editingReservationId}`");
  });
});

describe("Existing create/edit workflow — unaffected", () => {
  it("guest-phone/guest-email still exist and are untouched by this addition", () => {
    expect(source).toContain('id="guest-phone"');
    expect(source).toContain('id="guest-email"');
  });

  it("the edit banner and cancel-edit button are still present, same show/hide-on-mode convention this addition reuses", () => {
    expect(source).toContain('id="edit-banner"');
    expect(source).toContain('id="cancel-edit"');
  });
});
