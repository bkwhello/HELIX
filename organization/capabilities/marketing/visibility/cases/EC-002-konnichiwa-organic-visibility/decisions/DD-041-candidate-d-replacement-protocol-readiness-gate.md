# DD-041 — OD-001 Candidate D Replacement Protocol Readiness Gate

---

**Independent HELIX Protocol Readiness Gate review**, performed by Claude acting as independent reviewer, 28 September 2026, for EC-002 — Konnichiwa Organic Visibility Growth. The gate was created under the Case Owner's explicit instruction ("EC-002 — Create DD-041: OD-001 Candidate D Replacement Protocol Readiness Gate", 28 September 2026).

**Task boundary:** this gate reviews design/OD-001-candidate-d-replacement-measurement-protocol.md (committed at `9ec827f8035eec82fd809a78715ce1ac643ad1d4`) against its own readiness criteria R-1 to R-9, and records the Case Owner's Search Console inspection evidence of 28 September 2026.

**This gate is a readiness decision only. It is not an execution authorization.** It does not execute the protocol, does not perform runbook steps F0–F10, does not access or export from Google Search Console, does not create a measurement lock, and does not modify the protocol, EV-014, or any historical decision or observation. **Claude did not observe Search Console.** Every Search Console observation below is Case Owner-supplied evidence and is attributed as such.

---

## Precondition Check

| # | Precondition | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline` | **PASS** |
| 2 | Local HEAD, remote-tracking HEAD and live remote HEAD all `9ec827f8035eec82fd809a78715ce1ac643ad1d4`; ahead/behind 0/0 (fresh fetch, 28 September 2026) | **PASS** |
| 3 | Working tree clean, nothing staged, stash empty | **PASS** |
| 4 | Protocol unchanged since `9ec827f`; SHA-256 `cc348dc2ee30b4868161af4438722019d60153cef69430e41da4497f013a2327` | **PASS** |
| 5 | No `decisions/DD-041*` existed before this task | **PASS** |
| 6 | EV-014 raw files re-hashed read-only (28 September 2026): 7/7 match the SHA-256 values recorded in the protocol, section E | **PASS** |

**All six preconditions passed. Proceeding.**

---

## Review Sources

- design/OD-001-candidate-d-replacement-measurement-protocol.md (the reviewed protocol; sections A–K, Supplement)
- design/OD-001-candidate-d-measurement-protocol.md (original protocol; historical)
- decisions/DD-024-candidate-d-protocol-readiness-gate.md (Binding Conditions 1–21)
- decisions/DD-040-candidate-d-execution-blocker-case-owner-decision.md (execution blocker; Option B)
- observations/O-001.md (EV-014) and `evidence/raw/search-console-2026-07-23/` (seven CSVs, re-hashed)
- Case Owner Search Console inspection evidence, 28 September 2026 (Part 1)

---

## Part 1 — Case Owner Search Console Evidence (28 September 2026)

*All items in this part were observed by the Case Owner in the Google Search Console interface, on screen only, read-only, with no export and no settings change, under the Case Owner-approved "EC-002 Candidate D CO-4 Search Console inspection, READ-ONLY" scope. Claude did not access Search Console. The evidence is recorded here as the Case Owner reported it.*

### E-1 — Property selector

- **Observed (Case Owner):** the verified, accessed property is `https://konnichiwa.nl/`. A second entry `konnichiwa.nl` is shown, explicitly labelled **Domeinproperty**, under **Niet geverifieerd**.
- **Recorded as:** the accessible property is the **URL-prefix property `https://konnichiwa.nl/`**. The Domain property `konnichiwa.nl` is currently unverified.
- **Not established:** the property-selector state on 23 July 2026 (the EV-014 export date). No claim is made about it.

### E-2 — EV-014 baseline reproduction

On `https://konnichiwa.nl/`, search type **Web**, custom range **2026-04-21 through 2026-06-21**:

| Measure | Displayed in current Search Console UI (Case Owner) | EV-014 (repository, authoritative) | Match classification |
|---|---|---|---|
| Clicks (total) | 906 | 906 | **Exact** |
| Impressions (total) | 29.2K | 29,215 | **Consistent at UI display precision** (not an exact numerical match) |
| `teppanyaki utrecht`: clicks | 32 | 32 | **Exact** |
| `teppanyaki utrecht`: impressions | 375 | 375 | **Exact** |
| `teppanyaki utrecht`: CTR | 8.5% | 8.53% | Consistent with UI rounding |
| `teppanyaki utrecht`: average position | 4.5 | 4.47 | Consistent with UI rounding |
| `sushi utrecht` | Case Owner confirmed a match with EV-014 | 2 / 503 / 0.4% / 14.76 | **Confirmed by Case Owner; displayed values not retained.** Not reconstructed here. |

### E-3 — R1 availability screening

On `https://konnichiwa.nl/`, search type **Web**, range **2026-07-22 through 2026-09-21**: the Case Owner observed Search Console performance data displayed across the requested range. Visible approximate aggregates: clicks 1.04K, impressions 32.8K, CTR 3.2%, average position 7.6.

**These values are screening evidence only.** They are not Candidate D measurement results. They may not be used, cited or compared as results, and they do not satisfy G-5/G-6 (Part 3, Condition C-7). Only aggregate values were reported. No R1 per-query values were reported to or recorded by this gate.

### E-4 — The intervening interval, 2026-06-22 through 2026-07-21

On `https://konnichiwa.nl/`, the Case Owner inspected 2026-06-22 through 2026-07-21. The screen displayed:

> "Gegevens worden verwerkt. Controleer het over enkele dagen opnieuw."

and

> "Geen gegevens"

**Characterized precisely as: processing / no data currently displayed.** This is **not** zero traffic, **not** proven absence of Search Console data, **not** a permanently unavailable period, and **not** a confirmed data-loss event. **The cause is unknown.** The observation is consistent with the historical inability to retrieve this interval (O-001: the July export ended 2026-06-21; DD-040: the September attempt began at 2026-07-22).

### Observation recorded, not resolved

decisions/DD-040 records that on 21–22 September 2026 a requested start of 2026-06-22 was not honoured and the effective start was 2026-07-22. E-2 now shows data for April–June 2026 on `https://konnichiwa.nl/`. The two observations concern different date ranges and are not contradictory on their face, but DD-040's record does not name the property in its property-selector terms, and why data before 2026-06-22 displays today while 2026-06-22 to 2026-07-21 shows "processing" is **unknown**. DD-040 is not modified, and nothing is inferred about its cause.

---

## Part 2 — Assessment of the Protocol's Readiness Criteria R-1 to R-9

*Criteria quoted from the protocol, section H, "Readiness criteria for the future DD-041 gate".*

### R-1 — CO-1 to CO-9 recorded as decided

**Assessed: MET.** Protocol section J records all nine Case Owner decisions of 28 September 2026 with their encoding locations. CO-1, CO-2, CO-3 (with limitation), CO-6, CO-7, CO-8 and CO-9 are decided. CO-4 and CO-5 are decided *as hard stops*: their resolution is evidential (CO-4, R-3 below) or execution-time (CO-5, R-4 below), not a further Case Owner choice. No decision is open that would make the protocol under-specified.

### R-2 — CO-1 supplement (61 → 62 days) accepted as not changing EV-014's content

**Assessed: MET.** The Supplement corrects only the stated day count. EV-014's raw files are byte-identical to their recorded SHA-256 values (Precondition 6, 7/7). Baseline 2026-04-21 to 2026-06-21 = 62 calendar days inclusive. R1 2026-07-22 to 2026-09-21 = 62 calendar days inclusive. Both counts were independently recomputed for this gate. The historical records carrying "61 days" remain unmodified.

### R-3 — Property identity (CO-4 / G-3)

**Assessed: MET — CO-4 / G-3 = PASS, subject to evidence retention (Condition C-3).**

- **Observed (Case Owner):**
  - E-1: `https://konnichiwa.nl/` is the verified, accessible URL-prefix property, and the Domain property `konnichiwa.nl` is **Niet geverifieerd**.
  - E-2: on `https://konnichiwa.nl/`, the EV-014 window reproduces total clicks exactly (906), total impressions at display precision (29.2K against 29,215), and the `teppanyaki utrecht` row exactly on clicks and impressions (32 / 375), with CTR and position consistent with UI rounding. The `sushi utrecht` match was confirmed by the Case Owner, but its values were not retained.
  - E-3: the same property displays data across R1.
- **Observed (repository):** EV-014 raw files unchanged (7/7). DD-040's September export folder name was `https___konnichiwa.nl_-Performance-on-Search-2026-09-21`. DD-040 records "Property toegevoegd aan account — 23 juli 2026", the same date as the EV-014 export (O-001).
- **Inferred:** EV-014 was exported from `https://konnichiwa.nl/`, the only verified and accessible property, which reproduces EV-014's exact click total and an exact query-row fingerprint. The unverified Domain property cannot currently display data and so cannot present a competing fingerprint.
- **Unknown:** whether the Domain property was verified on 23 July 2026, and the `sushi utrecht` values as displayed.

**Why this suffices under the protocol.** R-3 requires one identified property that reproduces EV-014 and can supply R1, with its type and exact string recorded. An exact 906-click total together with an exact 32/375 query row excludes, for practical purposes, a different underlying dataset. The display-precision items are consistent and are not relied on as exact. **The identified property for Candidate D execution is `https://konnichiwa.nl/` (URL-prefix).** R-3 item 4 (the execution-time selector screenshot) is carried to runbook step F2 and item 5 (current read-only access) is met by E-1–E-3. The result depends on the inspection screenshots being retained (C-3). Without them this PASS is not auditable.

### R-4 — Method for recording account and timezone context (CO-5)

**Assessed: MET by this gate's specification below (Condition C-4).** The protocol requires recording "immediately before execution" (DD-024 Conditions 7–8), with redaction "only as the readiness gate specifies". This gate specifies the method.

**At runbook step F3, immediately before execution, record:**

1. **Logged-in Google account context:** a screenshot of the Search Console account indicator identifying the logged-in account.
2. **Permission level on `https://konnichiwa.nl/`:** a screenshot of Search Console Settings → Gebruikers en rechten (Users and permissions) showing the logged-in account's permission level on that property, recorded verbatim (for example "Eigenaar" or "Volledig").
3. **Same-context attestation:** a one-line Case Owner statement that this is the same account context used for the 28 September 2026 inspection (E-1 to E-4), or, if different, which one (redacted per the rule below).
4. **Timezone basis:** if Search Console displays an explicit timezone anywhere relevant to the Performance report or property settings, a screenshot and the value verbatim. **If no explicit timezone is displayed, record exactly `unconfirmed — platform default used`**, together with the observation that no explicit timezone was displayed and where it was looked for. This fallback is permitted because R-3 is met (protocol, section K.4). No timezone value may be inferred or supplied from outside Search Console.

**Redaction rule (binding):**

- The repository record keeps the **permission level verbatim**, the **account type** (Google account), and the account email **masked to the first character of the local part plus the full domain** (for example `k…@example.com`). The full address is not stored.
- Screenshots stored in the repository must show the account email masked the same way. Profile photos, names beyond the masked email, other users listed in Users and permissions, and any unrelated properties must be masked or cropped out.
- The unredacted account identity stays with the Case Owner. The masked record plus the same-context attestation is the governance evidence that the same authorized account context was used.
- No password, token, cookie, session identifier or API key may be requested, stored or recorded.

**CO-5 / G-4 remains a HARD STOP at execution** until items 1–4 are recorded at F3.

### R-5 — Runbook (F) and stop conditions (G) complete and non-inferential

**Assessed: MET.** Every runbook step F0–F10 ends in PASS or STOP, and no step allows inference in place of a failed check. G-1 to G-12 cover authorization, date window, property identity, account and timezone, unavailable dates, incomplete data, filter mismatch, internal inconsistency, definition drift, coverage, baseline integrity and settings changes. One addition is made binding at F0 by this gate: the evidence-retention check (C-3).

### R-6 — Comparability limitations disclosed and not characterized as immaterial

**Assessed: MET WITH QUALIFICATION (Condition C-5).** All ten limitations in protocol section C.4 are disclosed as material and non-causal. Limitation C.4(6) states "2026-06-22 through 2026-07-21 is unavailable". In light of E-4 this remains **acceptable as a disclosure** only with the following precise qualification, which is binding on any execution observation:

> For 2026-06-22 through 2026-07-21, the Case Owner's 28 September Search Console inspection displayed "Gegevens worden verwerkt. Controleer het over enkele dagen opnieuw." and "Geen gegevens". The interval is therefore not currently usable as measurement evidence. The underlying cause and whether data will later become available remain unknown.

No protocol supplement is required for readiness: the protocol never uses the interval, and "unavailable" is accurate in the sense of "not currently usable as measurement evidence". A future supplement is **recommended, not required**, to replace "unavailable" with this wording when the protocol is next amended for another reason. If the interval displays data at execution time, that is recorded as an observation only. It does not change R1, does not make the windows contiguous, and may not be used in any calculation without a new Case Owner decision and a protocol supplement.

### R-7 — Date constraints

**Assessed: MET.** Earliest execution/export date **2026-10-22** (R1 end 2026-09-21 plus the ≈31-day buffer; CO-8). Final date **2026-12-31**, inherited from DD-024 Condition 2 and explicitly retained for the replacement protocol (CO-8). **This gate does not permit execution before 2026-10-22 or after 2026-12-31** (G-2).

### R-8 — DD-024 conditions carried forward, replaced or corrected as stated

**Assessed: MET.** Protocol section I carries DD-024 Conditions 3, 7–21 unchanged, carries Condition 6 with CO-6 and CO-7 made explicit, supersedes Condition 1 with the stricter 2026-10-22, replaces Condition 4 with R1 (DD-040 Option B; CO-2), corrects Condition 5 to 62 days (CO-1), and retains Condition 2 (CO-8). Each change names its authority. DD-024 itself is unmodified.

### R-9 — No Search Console access in design or gate review

**Assessed: MET WITH DISCLOSURE.** Claude did not access Search Console in designing the protocol or in this review, and no Search Console export has been made for the replacement protocol. **Disclosure:** between design (H.1, 28 September 2026) and this gate, the Case Owner performed a separately authorized, on-screen, read-only inspection (Part 1) to resolve CO-4. That inspection involved no export and no settings change. Its R1 aggregates were viewed after the Phase 6 outcome rules were fixed at `9ec827f` and do not alter them. No R1 per-query values were reported. The inspection is not execution and does not count as the governed measurement.

---

## Part 3 — Case Owner Review Topics

*The Case Owner's instruction for this gate named review topics that partly use different labels from the protocol's R-numbers. They are addressed here and mapped to the assessment above. The protocol's own numbering (Part 2) governs.*

| Case Owner topic | Result | Where assessed |
|---|---|---|
| Case Owner decisions CO-1–CO-9 | Sufficiently fixed | R-1 |
| Window and timing: baseline 2026-04-21–06-21 (62 days), R1 2026-07-22–09-21 (62 days), earliest 2026-10-22, expiry 2026-12-31, no execution before 2026-10-22 | Retained | R-2, R-7 |
| Property identity (CO-4 / G-3): `https://konnichiwa.nl/` | PASS, subject to C-3 | R-3 |
| Account and timezone recording method and redaction | Specified | R-4 |
| R1 availability (E-3) | **Favourable pre-execution screen only.** Formal G-5/G-6 remains an execution-time gate (F4–F5: exactly 62 contiguous daily rows in `Diagram.csv`) | E-3; C-7 |
| Disclosure accuracy for 2026-06-22–07-21 (E-4) | Acceptable with binding qualification | R-6; C-5 |
| Filters and definitions | Execution still requires the protocol-defined property (`https://konnichiwa.nl/`), search type Web, exact range 2026-07-22–2026-09-21, no other filters, the five exact query rows and the section D metric definitions. **No substitution based on the 28 September screenshots.** | Protocol B, D; C-6, C-7 |
| EV-014 integrity | 7/7 SHA-256 match on 28 September 2026 (Precondition 6). Recheck at F1 remains required (G-11). | R-2; G-11 |
| Execution controls | All execution-time hard stops remain binding. Passing this gate waives none of G-4 to G-12. | Part 4 |

---

## Part 4 — Stop-Condition Status at Readiness

| Gate | Status at readiness | Basis |
|---|---|---|
| G-1 Readiness gate and execution authorization | **Readiness: met by this gate. Execution authorization: PENDING** | H.3 requires a separate Case Owner authorization |
| G-2 Date window | **NOT YET APPLICABLE** (execution before 2026-10-22 is prohibited) | R-7 |
| G-3 Property identity | **PASS** (subject to C-3), re-confirmed at F2 | R-3 |
| G-4 Account and timezone | **HARD STOP until recorded at F3** | R-4 |
| G-5 Unavailable dates | **NOT YET APPLICABLE** (E-3 favourable screen only) | F4–F5 |
| G-6 Incomplete data | **NOT YET APPLICABLE** | F5 |
| G-7 Filter mismatch | **NOT YET APPLICABLE** | F7 |
| G-8 Internal inconsistency | **NOT YET APPLICABLE** | F7 |
| G-9 Definition drift | **NOT YET APPLICABLE** (UI display rounding is not drift; exported values govern) | F8–F9 |
| G-10 Coverage | **NOT YET APPLICABLE** | after F8 |
| G-11 EV-014 integrity | **PASS on 28 September 2026**, rechecked at F1 | Precondition 6 |
| G-12 Settings change required | **PASS so far** (none required in E-1–E-4), rechecked at execution | Part 1 |

---

## Part 5 — Gate Verdict

**Gate Verdict: PASSED WITH CONDITIONS.**

All nine readiness criteria R-1 to R-9 are met. R-3 is met subject to evidence retention; R-6 and R-9 are met with qualification or disclosure.

**H.2 = PASS — Ready for Execution** (with the binding conditions below).

**This is not execution authorization, and Candidate D may not execute today.** The earliest permitted execution/export date is **2026-10-22**, the protocol lapses unexecuted after **2026-12-31**, and every execution-time hard stop remains binding.

### State separation

| State | Status |
|---|---|
| 1. Protocol design complete (protocol H.1) | **PASS** (Case Owner approval, 28 September 2026; committed `9ec827f`) |
| 2. Protocol readiness approved (protocol H.2) | **PASS WITH CONDITIONS** (this gate) |
| 3. Execution authorized (protocol H.3) | **Not authorized.** Requires a separate, explicit Case Owner authorization naming this protocol. |
| 4. Execution started | **No** |
| 5. Execution completed / measurement executed (protocol H.4) | **No** |
| — Result interpreted (protocol H.5) | **No** |

### Binding Conditions

- **C-1 — Dates.** No execution or export before 2026-10-22. The protocol lapses unexecuted after 2026-12-31. The window never slides forward.
- **C-2 — Separate authorization.** Execution requires a separate, explicit Case Owner authorization (H.3) naming this protocol. This gate is not that authorization, and no authorization may be inferred from approval of this gate, its commit or its push.
- **C-3 — Evidence retention (added as an F0 check).** Before runbook step F0 can pass, the Case Owner inspection screenshots must be stored in the repository, redacted per R-4, with SHA-256 values recorded, and referenced from the execution observation:
  1. property selector (E-1);
  2. EV-014 baseline totals (E-2);
  3. `teppanyaki utrecht` row (E-2);
  4. `sushi utrecht` row, **if available**; if not available, it is recorded as "confirmed by Case Owner, values not retained";
  5. R1 range screening (E-3);
  6. the 2026-06-22–2026-07-21 processing/no-data screen (E-4).

  **These are Case Owner-supplied evidence pending formal retention.** No repository path is assigned by this gate. If items 1–3, 5 and 6 are not retained, **F0 = STOP**.
- **C-4 — Account and timezone.** Recorded at F3 exactly as specified in R-4, including the redaction rule and the `unconfirmed — platform default used` fallback.
- **C-5 — Interval qualification.** Any execution observation must reproduce the R-6 wording for 2026-06-22–2026-07-21. The interval may not be described as zero, absent or permanently unavailable, and may not be used in any calculation.
- **C-6 — Property.** At F2 the selected property must be exactly `https://konnichiwa.nl/` (URL-prefix). The Domain property `konnichiwa.nl` may not be used for Candidate D, even if its verification status changes. Any change is recorded, not acted on. If `https://konnichiwa.nl/` is inaccessible or shows a different type or string, STOP (G-3).
- **C-7 — Screening quarantine.** The E-3 aggregates (1.04K / 32.8K / 3.2% / 7.6) and any other on-screen values from the 28 September inspection are not results. They may not be cited, compared or used in any Candidate D calculation or interpretation.
- **C-8 — All stop conditions binding.** G-1 to G-12 and all DD-024 conditions carried forward in protocol section I remain binding. This gate waives none of them.
- **C-9 — Boundaries unchanged.** No automation or scheduled task. OD-002 Design not started. No selection among Candidates A/B/C. Transformation and external changes remain unauthorized.

### Effect on Lifecycle State (proposed; not yet recorded in current.md)

```yaml
candidate_d_replacement_protocol_design_started: true
candidate_d_replacement_protocol_design_complete: true
candidate_d_replacement_protocol_readiness_gate: DD-041 — Passed With Conditions
candidate_d_replacement_protocol_ready_for_execution: true
candidate_d_replacement_protocol_property: https://konnichiwa.nl/ (URL-prefix)
candidate_d_replacement_protocol_not_before: 2026-10-22
candidate_d_replacement_protocol_expires: 2026-12-31
candidate_d_replacement_execution_authorized: false
candidate_d_replacement_protocol_locked: false
candidate_d_protocol_executed: false
candidate_d_timezone_basis: Pending Pre-Execution Recording (F3)
candidate_d_account_context: Pending Pre-Execution Recording (F3)
od_001_design_established: false
od_002_design_started: false
transformation_authorized: false
external_changes_authorized: false
```

These fields are proposed for a later governance update. current.md is not modified by this gate.

---

## Requested Case-Owner Response (for a later, separate step)

This gate records readiness; it does not authorize execution. A future execution authorization, if the Case Owner chooses to give one, must be a separate explicit instruction naming this protocol, for example:

```
APPROVED FOR READ-ONLY EXECUTION OF THE CANDIDATE D REPLACEMENT PROTOCOL (ON OR AFTER 2026-10-22)

APPROVED WITH CONDITIONS FOR READ-ONLY EXECUTION OF THE CANDIDATE D REPLACEMENT PROTOCOL (ON OR AFTER 2026-10-22)

NOT APPROVED FOR EXECUTION
```

No such response is inferred from general permission to "continue", or from approval, commit or push of this gate.

---

## Scope of This Change

| File | Change |
|---|---|
| `decisions/DD-041-candidate-d-replacement-protocol-readiness-gate.md` | Created (this file) |

**Not modified:** the replacement protocol, the original protocol, DD-024, DD-040, O-001, EV-014 raw files, measurement/HV-DB-001.md, current.md, Traceability.md, and every other historical artifact. **Not created:** O-032, any evidence record, any execution log, any lock. No Search Console access by Claude. No export, no settings change, and no production, WordPress, GTM or GA4 change.

## Traceability

Authority: decisions/DD-040 (Option B), design/OD-001-candidate-d-replacement-measurement-protocol.md at `9ec827f` (section H, R-1–R-9), Case Owner instruction of 28 September 2026. Evidence: Case Owner Search Console inspection, 28 September 2026 (E-1–E-4; pending formal retention, C-3); EV-014 raw files re-hashed 28 September 2026 (7/7). Inherited: decisions/DD-024 Binding Conditions 1–21 as carried by protocol section I.
