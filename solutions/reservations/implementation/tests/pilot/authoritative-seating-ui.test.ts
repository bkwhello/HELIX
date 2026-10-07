import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.5-P7-C — P0-3 pilot regression. The daily list's "Tafel" column used
 * to be an editable free-text input bound to the legacy
 * Reservation.tableAssignment; it is now a read-only presentation of the
 * authoritative `seating` (active SeatingAssignment) from GET /reservations.
 * describeSeating() is a pure function, so it is extracted from the shipped
 * source and executed (service-session-ui.test.ts precedent); the rest is
 * the plain source-text convention. Browser proof:
 * tests/e2e/authoritative-seating.spec.ts.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let renderListBlock: string;
let submitHandler: string;

type Seating = { status: string; resources: { kind: string; label: string; tableLabel: string }[] } | undefined;
let describeSeating: (s: Seating) => { text: string; stateLabel: string };

function between(start: string, end: string, from = 0): string {
  const s = source.indexOf(start, from);
  expect(s, `missing start marker ${start}`).toBeGreaterThan(-1);
  const e = source.indexOf(end, s + start.length);
  expect(e, `missing end marker ${end}`).toBeGreaterThan(s);
  return source.slice(s, e);
}

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8").replace(/\r\n/g, "\n");
  renderListBlock = between("function renderList() {", "searchInput.addEventListener(\"input\", renderList);");
  submitHandler = between('createForm.addEventListener("submit"', "// P1-B3 — CAP-D04.01/CAP-D02.03 immediate Walk-in");
  const fnSource = between("function describeSeating(seating) {", "function renderList() {");
  describeSeating = new Function(`${fnSource}\nreturn describeSeating;`)() as typeof describeSeating;
});

describe("R1.5-P7-C — Tafel shows the authoritative seating, read-only", () => {
  it("K — no active assignment (or no seating at all) → 'Niet toegewezen', no state label", () => {
    expect(describeSeating({ status: "Unassigned", resources: [] })).toEqual({ text: "Niet toegewezen", stateLabel: "" });
    expect(describeSeating(undefined)).toEqual({ text: "Niet toegewezen", stateLabel: "" });
  });

  it("L — Assigned shows the actual resource label(s) and 'Toegewezen'", () => {
    expect(describeSeating({ status: "Assigned", resources: [{ kind: "Table", label: "Table 5", tableLabel: "Table 5" }] })).toEqual({ text: "Table 5", stateLabel: "Toegewezen" });
    expect(
      describeSeating({
        status: "Assigned",
        resources: [
          { kind: "Seat", label: "C-03", tableLabel: "C" },
          { kind: "Seat", label: "C-04", tableLabel: "C" },
        ],
      })
    ).toEqual({ text: "Grill C · C-03, C-04", stateLabel: "Toegewezen" });
  });

  it("M — Seated shows the actual resource label(s) and 'Gezeten'", () => {
    expect(describeSeating({ status: "Seated", resources: [{ kind: "Table", label: "Bar 17", tableLabel: "Bar 17" }] })).toEqual({ text: "Bar 17", stateLabel: "Gezeten" });
  });

  it("N — the row renders ONLY r.seating; the legacy r.tableAssignment is never read or displayed", () => {
    const tafelCell = between('tableCell.dataset.label = "Tafel";', "// Time is the primary thing staff scan for during service");
    expect(tafelCell).toContain("describeSeating(r.seating)");
    expect(tafelCell).toContain("seatingText.textContent = seatingView.text;");
    const code = (block: string) => block.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(code(renderListBlock)).not.toMatch(/\btableAssignment\b/);
  });

  it("O — the list offers no editable table field (no input in the Tafel cell, no legacy table save)", () => {
    const tafelCell = between('tableCell.dataset.label = "Tafel";', "// Time is the primary thing staff scan for during service");
    expect(tafelCell).not.toContain('createElement("input")');
    expect(source).not.toContain("table-input");
    expect(source).not.toMatch(/saveReservationField\([^)]*tableAssignment/);
    // The edit form has no table field either.
    const form = between('<form id="create-form"', "</form>");
    expect(form).not.toMatch(/<(input|select|textarea)\b[^>]*\b(id|name)="[^"]*(table|tafel)[^"]*"/i);
    expect(form).not.toMatch(/<label\b[^>]*>\s*(Tafel|Table)\b/i);
  });

  it("P — no request built by the page sends tableAssignment (edit save included)", () => {
    const code = (block: string) => block.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(code(submitHandler)).not.toMatch(/\btableAssignment\b/);
    const scripts = source.slice(source.indexOf("<script>"));
    expect(code(scripts)).not.toMatch(/tableAssignment\s*:/);
  });

  it("Q — H5 row actions still gate on the authoritative seatingAssignmentStatus (Tafel toewijzen / Nu plaatsen / Verplaatsen)", () => {
    expect(renderListBlock).toContain('const hasActiveAssignment = r.seatingAssignmentStatus === "Assigned" || r.seatingAssignmentStatus === "Seated";');
    expect(renderListBlock).toContain('assignButton.textContent = "Tafel toewijzen";');
    expect(renderListBlock).toContain('} else if (r.seatingAssignmentStatus === "Assigned") {');
    expect(renderListBlock).toContain('markSeatedButton.textContent = "Nu plaatsen";');
    expect(renderListBlock).toContain('moveButton.textContent = "Verplaatsen";');
  });
});
