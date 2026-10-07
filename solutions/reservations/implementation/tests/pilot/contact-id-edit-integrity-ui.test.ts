import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.5-P7-A — P0-1 pilot regression (source-text convention, as
 * contact-snapshot-edit-ui.test.ts). The edit form used to fill the field
 * labelled "Telefoon" (guest-phone) with r.contactId and send it back as
 * changes.contactId. Browser-level proof (real save + reload, forbidden
 * contactId -> 422) is in tests/e2e/contact-id-edit-integrity.spec.ts.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let enterEditModeBlock: string;
let exitEditModeBlock: string;
let editPatchBlock: string;
let createPostBlock: string;

function between(start: string, end: string, from = 0): string {
  const s = source.indexOf(start, from);
  expect(s, `missing start marker ${start}`).toBeGreaterThan(-1);
  const e = source.indexOf(end, s + start.length);
  expect(e, `missing end marker ${end}`).toBeGreaterThan(s);
  return source.slice(s, e);
}

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8").replace(/\r\n/g, "\n");
  enterEditModeBlock = between("async function enterEditMode(r) {", "function exitEditMode() {");
  exitEditModeBlock = between("function exitEditMode() {", 'cancelEditButton.addEventListener("click", exitEditMode);');
  const submit = between('createForm.addEventListener("submit"', "// P1-B3 — CAP-D04.01/CAP-D02.03 immediate Walk-in");
  editPatchBlock = submit.slice(submit.indexOf("if (editingReservationId) {"), submit.indexOf("const contactSelection = selectedExistingContactId"));
  createPostBlock = submit.slice(submit.indexOf("const contactSelection = selectedExistingContactId"));
});

describe("R1.5-P7-A — the internal contactId is never an editable guest field", () => {
  it("G — edit mode fills the snapshot field labelled 'Telefoon' with the reservation's real phone snapshot", () => {
    expect(source).toContain('<label for="contact-phone-snapshot">Telefoon</label>');
    expect(enterEditModeBlock).toContain('document.getElementById("contact-phone-snapshot").value = r.contactPhoneSnapshot || "";');
    expect(enterEditModeBlock).toContain('document.getElementById("contact-snapshot-row").style.display = "";');
  });

  it("H — edit mode never writes r.contactId into any input; the create-only Contact inputs are cleared, disabled and hidden", () => {
    expect(enterEditModeBlock).not.toMatch(/\.value\s*=\s*r\.contactId/);
    expect(source).not.toContain('document.getElementById("guest-phone").value = r.contactId');
    expect(enterEditModeBlock).toContain("setContactSelectionFieldsForEdit(true);");
    const helper = between("function setContactSelectionFieldsForEdit(isEdit) {", "async function enterEditMode(r) {");
    expect(helper).toContain('phone.value = "";');
    expect(helper).toContain("phone.disabled = isEdit;");
    expect(helper).toContain("email.disabled = isEdit;");
    expect(helper).toContain('document.getElementById("guest-phone-field").style.display = isEdit ? "none" : "";');
    expect(helper).toContain('document.getElementById("guest-contact-row").style.display = isEdit ? "none" : "";');
  });

  it("I — the edit save sends the phone as contactPhoneSnapshot (existing validated field)", () => {
    expect(editPatchBlock).toContain('contactPhoneSnapshot: document.getElementById("contact-phone-snapshot").value.trim() || undefined,');
    expect(editPatchBlock).toContain("fetch(`/availability/reservations/${editingReservationId}`");
  });

  it("J — the edit save request contains no contactId and never reads guest-phone", () => {
    // Code only — explanatory `//` comments may mention contactId.
    const code = editPatchBlock.split("\n").filter((line) => !line.trim().startsWith("//")).join("\n");
    expect(code).toContain("changes: {");
    expect(code).not.toMatch(/\bcontactId\s*:/);
    expect(code).not.toContain('getElementById("guest-phone")');
  });

  it("K — leaving edit mode restores the create-only inputs and hides the snapshot row, so no phone value carries over", () => {
    expect(exitEditModeBlock).toContain("createForm.reset();");
    expect(exitEditModeBlock).toContain("setContactSelectionFieldsForEdit(false);");
    expect(exitEditModeBlock).toContain('document.getElementById("contact-snapshot-row").style.display = "none";');
    // Each enterEditMode() overwrites the snapshot from THAT reservation (never left from a previous one).
    expect(enterEditModeBlock).toContain('document.getElementById("contact-email-snapshot").value = r.contactEmailSnapshot || "";');
  });

  it("L — Create is unchanged: guest-phone/guest-email still select or create the Contact in the POST body", () => {
    expect(source).toContain('<input id="guest-phone" type="tel" required placeholder="06-12345678" />');
    expect(createPostBlock).toContain('{ type: "ExistingContact", contactId: selectedExistingContactId }');
    expect(createPostBlock).toContain('phone: document.getElementById("guest-phone").value.trim() || undefined,');
    expect(createPostBlock).toContain('email: document.getElementById("guest-email").value.trim() || undefined,');
    expect(createPostBlock).toContain('fetch("/availability/reservations", {');
  });
});
