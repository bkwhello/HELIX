# OD2-CAND-3 — Cache-State Evidence Request / Verification Specification

---

Date: 3 August 2026. Author: Claude, acting as an **independent HELIX Design Constructor** for EC-002, scoped exclusively to OD2-CAND-3 (Stage 1 of decisions/DD-025's Case-Owner Selection, Kelvin Wong, 2 August 2026). This is a **specification only** — it defines what evidence would verify konnichiwa.nl's actual HTML page-cache-delivery status and how Kelvin could supply it. **It does not execute anything.** No hosting, WordPress, CDN, or cache system is inspected by this document; no screenshot, export, or evidence item is collected; no configuration is accessed or changed; OD2-CAND-2 (Stage 2) is not started; no Transformation gate is created.

---

## Status

**Not executed.** Specification only, per decisions/DD-025 Binding Selection Condition 2 ("Stage 1 may produce only a cache-state evidence request/specification"). Bounded evidence collection under this specification does not begin until Kelvin issues explicit approval — see Section 8.

## Precondition Check

| # | Check | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline` | **PASS** |
| 2 | Local HEAD = `bb93d97e0d15b099dbd26f1e71f9916e3534033c` | **PASS** |
| 3 | `origin/feat/ec-002-visibility-baseline` = same, ahead/behind 0/0 | **PASS** |
| 4 | Working tree clean at start | **PASS** |
| 5 | decisions/DD-025 Case-Owner Selection: OD2-CAND-3 Selected — Stage 1 | **PASS** |
| 6 | `od_002_stage_2_authorized: false`; `od_002_design_established: false` | **PASS** |
| 7 | No prior OD2-CAND-3 specification exists | **PASS** |

## Authority and Binding Boundaries Carried Forward

- decisions/DD-025, Case-Owner Selection section — OD2-CAND-3 Selected — Stage 1; OD2-CAND-2 Selected Conditionally — Stage 2, Pending Stage 1 Review.
- Binding Selection Conditions restated as directly load-bearing here: (2) Stage 1 may produce only a cache-state evidence request/specification; (3) no cache, CDN, hosting, WordPress, plugin, or server setting may be changed; (4) missing public cache headers remain insufficient to prove caching is absent; (5) a confirmed active cache must be treated as potentially material new evidence against or narrowing OD-002; (6) if active caching is confirmed, pause the workstream and request a lifecycle and case-owner review before Stage 2; (7) if cache state remains unconfirmed, it is not encoded as absent; (8) starting Stage 2 requires a new explicit case-owner authorization after the Stage 1 result; (10) no credentials, passwords, API keys, or unrestricted account access may be requested or stored; (11) absence of evidence remains a blocker, not a finding; (12) restricted evidence remains distinct from public timing, lab, and CrUX evidence.
- diagnosis/OD-002-absence-of-html-caching-layer.md's authoritative formulation (DD-018 Condition 2) — "missing cache/CDN response headers are not proof that caching is absent" — carried forward as this specification's own Section 5.
- design/OD-002-design-workstream.md, OD2-CAND-3's own Phase 5 construction (Evidence required before eligibility, Falsification Criteria, Stop Conditions) — this specification operationalizes that candidate's design, without exceeding it.

None of these is lifted, narrowed, or reinterpreted below.

---

## 1. Definition — HTML Page-Cache Delivery (Narrow Scope)

**HTML page-cache delivery** means: a mechanism by which a fully-rendered HTML response for a given page request is stored after first generation, such that a subsequent, equivalent request is served that stored copy directly, without the origin re-executing the full request-processing pipeline (e.g., WordPress/PHP page rendering, template assembly, database-backed content composition) to produce the HTML again.

This definition is deliberately narrow. It concerns **only** whether the HTML document itself is cached and re-served — not any other kind of caching that may coexist with, substitute for, or be mistaken for it (Section 1.2).

### 1.1 In-Scope Categories (kept separate, never conflated)

| Category | Where it operates | What it would show if active |
|---|---|---|
| **CDN/edge cache** | A geographically distributed edge network in front of the origin; the request may never reach konnichiwa.nl's hosting origin at all if served from edge | A CDN's own dashboard/configuration screen shows caching rules enabled for HTML/page responses on this domain; delivered responses may show CDN-identifying headers (e.g., a cache/edge-node header), though absence of such a header does not itself prove no CDN cache exists (Section 5) |
| **Host/reverse-proxy page cache** | The hosting infrastructure's own reverse-proxy or web-server layer (e.g., a server-level page-cache module), in front of the PHP/application layer but still within the origin's own infrastructure | The hosting control panel exposes a caching/performance toggle or status specific to page/HTML caching, separate from any WordPress-plugin-level setting |
| **WordPress full-page cache (plugin-level)** | The WordPress application layer itself, via a caching plugin that stores or serves rendered HTML output | The WordPress admin plugin list (CSE-1) shows an active caching plugin, and that plugin's own settings screen (CSE-2) shows page/full-page caching enabled specifically (not merely, e.g., minification or database optimization features bundled into the same plugin) |

A site may have any combination of these three active, inactive, or entirely absent, independently of the others. Evidence establishing the state of one category never establishes the state of another; every evidence item collected under Section 3 must be labeled with exactly which category (or which excluded category, Section 1.2) it pertains to.

### 1.2 Explicitly Excluded (must not be mistaken for HTML page caching)

| Category | Why it is excluded |
|---|---|
| **Browser cache** | Client-side caching, controlled by the visitor's browser via response headers (e.g., `Cache-Control`, `Expires`) — describes what a visitor's own browser does with a response it already received, not whether the origin/CDN/proxy served a cached HTML document in the first place. Out of scope entirely. |
| **Static-asset cache** | Caching of CSS, JavaScript, image, or font files. A site can aggressively cache every static asset while never caching the HTML document itself — the two are independent. |
| **Object cache** | Caching of database query results or computed PHP objects (e.g., via an in-memory store). This can materially speed up how fast the HTML is *generated* without caching the *generated HTML output* itself — a site can have an active, effective object cache and zero HTML page caching simultaneously. This is directly relevant to this case: object-cache activity could confound a future attempt to reason about response-time improvements without ever bearing on OD-002's caching-absence question. |
| **PHP OPcache** | Caching of compiled PHP bytecode, speeding up script execution, not the rendered HTML response. Fully orthogonal to HTML page-cache delivery. |

Any evidence item that only demonstrates one of these four excluded categories is recorded as informative context, never as evidence toward CS-1 (Section 6) or any other in-scope-category conclusion.

---

## 2. Configured State vs. Delivered State

Two distinct dimensions, evidenced separately, never merged into one conclusion:

| Dimension | What it means | Existing evidence, if any |
|---|---|---|
| **Configured cache state** | What a control panel, plugin settings screen, or hosting dashboard reports as the intended/enabled setting (e.g., a "Page Cache: Enabled" toggle) | None yet — this specification requests it (Section 3); not previously accessed |
| **Delivered cache state** | What is actually observed in real HTTP responses to the already-published site (e.g., presence/absence of cache-indicating headers, non-accelerating repeat-request timing) | Already partially observed, read-only and public, in diagnosis/DQ-004-investigation.md Phase 2B — no cache/CDN header found across four tested pages; repeat requests showed no "warm cache" speed-up |

A cache can be **configured but not delivering** (e.g., misconfigured, excluded for the tested pages, bypassed by a plugin conflict) or, in principle, delivering despite an unclear configuration screen. This specification requests evidence for both dimensions independently and does not assume they agree — a disagreement between them is itself a pre-registered outcome (CS-3, Section 6), not an error to be silently resolved.

---

## 3. Evidence Request Items (screenshots / redacted exports only)

Every item below is **optional** for Kelvin to supply. None is collected, requested to be sent immediately, or accessed by this task. "Absence of evidence remains a blocker" (Binding Selection Condition 11) — an unsupplied item is recorded as **Not Supplied**, never as evidence that the corresponding cache category is absent. **Configured-state items (CSE-1, CSE-2, CSE-3, CSE-4, CSE-5B, CSE-6) and delivered-state evidence (CSE-5A) are evaluated on two separate axes (Section 6) — a configured "enabled" reading never by itself establishes delivered confirmation, and a generic hit ratio blending HTML with assets, other domains, or unidentified traffic does not satisfy CSE-5A and is classified Unconfirmed on the Delivered-State axis (Section 6.2).**

| ID | Item | Category | What it would show | Redaction requirement |
|---|---|---|---|---|
| CSE-1 | Screenshot of the WordPress admin **Plugins** page (installed/active list only) | WordPress full-page cache (screening step) | Whether any caching-named plugin is installed and active, by name | Crop/blur any license keys, unrelated account identifiers; the plugin name list itself is not sensitive |
| CSE-2 | Screenshot of that caching plugin's own **settings/status** screen, if CSE-1 identifies one | WordPress full-page cache | The enabled/disabled toggle state, and which cache types the plugin itself distinguishes (e.g., separate "page cache" vs. "object cache" checkboxes) | Crop out any API key, license key, or token field entirely — do not include the field even redacted-in-place; omit the row/section if unavoidable |
| CSE-3 | Screenshot of the **hosting control panel's** performance/caching tab, if the provider exposes one | Host/reverse-proxy page cache | Whether a host-level or reverse-proxy page cache is enabled for konnichiwa.nl specifically | Crop out account number, billing information, server IP if the provider treats it as sensitive, any credential or API-token field |
| CSE-4 | Screenshot of a **CDN provider dashboard** (if one is in use) showing caching-configuration status for the domain | CDN/edge cache | Whether an edge cache is active, and its scope (e.g., HTML vs. static-assets-only rules) | Crop out account/zone identifiers not needed for the yes/no + scope determination, any API-token or credential field |
| CSE-5A | A redacted export or screenshot of **HTML-specific cache hit/miss evidence** — must identify (i) konnichiwa.nl, (ii) the specific eligible HTML document(s) covered, (iii) the evidence period, and (iv) an explicit hit/miss state or an HTML-document-specific hit ratio (not blended with assets or other traffic) | **Delivered-state evidence** (governs the Delivered-State axis, Section 6) | Whether real, anonymous public requests for HTML documents are actually being served from cache — the only item that can establish Delivered = Confirmed HTML Cache Hit | Strip any raw visitor IP addresses, any embedded auth tokens in log lines; a redacted/aggregated view scoped to HTML documents is sufficient — raw per-request logs are not requested |
| CSE-5B | A redacted export or screenshot of a **cache-purge log** (records of purge/invalidation events, without a hit/miss breakdown) | **Configured-state evidence only** — never delivered-cache-hit evidence | That a cache-management mechanism exists and is actively administered — supports, but does not by itself confirm, that HTML responses are actually being served from cache | Strip any raw visitor IP addresses, any embedded auth tokens in log lines |
| CSE-6 | A screenshot or copy of a **written confirmation from the hosting/CDN provider's own support channel or documentation**, dated, stating whether page caching is active for this account | Configured-state, provider-attested | An independent, provider-sourced statement, useful when dashboard screenshots are unclear or unavailable | Crop out any account number or ticket-identifying information not needed to date and attribute the statement |

No item above requests, and none may be substituted with, a password, API key, token, cookie, session identifier, FTP/SSH credential, or unrestricted/full administrative account access (Section 4). If Kelvin supplies a screenshot that inadvertently includes such data, it is flagged for redaction and excluded from any repository record before further use — never retained or incorporated as-is. If konnichiwa.nl is hosted on shared infrastructure where a control-panel or dashboard screenshot would otherwise show sibling domains, other clients' account identifiers, or unrelated site names, those are cropped or blacked out with the same discipline as a credential field — they are not this specification's evidence target and are not needed to answer any CS question.

### 3.1 Scope Boundary — No Additional Public Probing

This specification does not request or authorize any additional public HTTP requests, header inspections, or repeat-timing tests beyond what diagnosis/DQ-004-investigation.md Phase 2B already recorded. If a future evidence-collection round under this specification identifies a need for further read-only public measurement (e.g., re-testing headers after a configuration is clarified), that is raised as a proposed amendment to design/OD-002-design-workstream.md's own Phase 4 Public Request Layer, not performed silently under this specification's authority.

### 3.2 Scope-Creep Escalation Rule

If, once evidence collection begins, it becomes apparent that resolving CS-1 through CS-4 requires an evidence item not listed among CSE-1–CSE-6, that need is recorded and reported back for a specification amendment and fresh case-owner approval — it is not pursued ad hoc, and no new evidence category is requested directly from Kelvin without first being added, explicitly, to this document.

---

## 4. Explicit Prohibitions (restated, binding)

**Never requested. Never accepted if offered without being flagged. Never stored in this repository:**

- Passwords of any kind.
- API keys, license keys, or access tokens.
- Cookies or session identifiers.
- FTP, SFTP, or SSH credentials.
- Unrestricted or full administrative account access of any kind.

This specification requests only the six bounded, screenshot/export-level items in Section 3 — nothing broader. If any future evidence submission includes prohibited material, it is excluded and flagged before incorporation, not silently redacted-and-kept or used to infer anything.

---

## 5. Missing-Evidence Discipline

Missing headers (already documented, diagnosis/DQ-004-investigation.md Phase 2B), a missing or unsupplied screenshot, an unanswered evidence request, or a "not available"/"don't know" response from Kelvin **never proves or implies that caching is absent** — this is diagnosis/OD-002-absence-of-html-caching-layer.md's own authoritative Condition 2/3 (decisions/DD-018), restated here as a binding rule for this specification specifically. Every gap is recorded explicitly as **Not Supplied** or **Not Available**; none is silently converted into a negative finding, and none contributes to CS-2 (Section 6) by itself — CS-2 requires evidence that inspected items show no caching, not merely that items were not inspected.

---

## 6. Pre-Registered Outcome Classes (CS-1 through CS-4)

Registered before any evidence is collected, so no outcome can be shaped retroactively to fit whatever is eventually supplied. **Corrected per decisions/DD-026's Bounded Correction (3 August 2026)** to a genuinely **two-dimensional state model** — configured cache state and delivered cache state are tracked, evidenced, and reported as two independent axes; neither substitutes for the other, and CS-1 through CS-4 are derived from their combination, not from a single flattened test.

### 6.0 Governing Rule

**Configured cache state and delivered cache state must be reported independently; neither may substitute for the other** (decisions/DD-026, Bounded Correction Condition). A Tier-2 "enabled" setting establishes only "HTML cache configured/enabled" — it does **not**, by itself, establish "HTML cache delivery confirmed." Only direct delivered-state evidence (CSE-5A) can establish that an eligible anonymous public HTML response was actually served from cache.

### 6.1 Configured-State Axis (five values)

| Value | Meets when |
|---|---|
| **Confirmed Enabled** | A Tier-2 item (CSE-2, CSE-3, or CSE-4) shows an explicit "enabled"/"active" state for HTML/page-level caching specifically (not static-asset, minification, or object-cache features bundled under the same product) |
| **Confirmed Disabled** | A Tier-2 item shows an explicit "disabled"/"inactive" state for HTML/page-level caching specifically |
| **Not Present Within Inspected Layer** | The relevant control surface was inspected (e.g., CSE-1 shows no caching-named plugin installed; CSE-3/CSE-4 shows no caching feature/product exists for this account) and no HTML-page-cache mechanism was found for that layer |
| **Unconfirmed** | The relevant control surface was not inspected, or CSE-1 alone was supplied without a corresponding CSE-2 (plugin present, but its own settings screen not seen) |
| **Conflicting** | Two or more configured-state items **for the same layer, same configuration scope, and a materially comparable time window** disagree with each other (e.g., a plugin's settings screen shows "enabled" while a support-channel confirmation, CSE-6, dated the same week, says "disabled"). Items separated by a materially different time window are not "Conflicting" — they may instead reflect a genuine configuration change over time; each is recorded with its own date, and the most recent is treated as current unless stated otherwise. |

Evaluated **per in-scope category** (WordPress full-page cache, host/reverse-proxy page cache, CDN/edge cache) — a single configured-state value is not assigned across all three categories at once; Section 6.6 defines how the three per-category results combine into a case-level outcome, evaluating each layer independently first.

### 6.2 Delivered-State Axis (four values)

| Value | Meets when |
|---|---|
| **Confirmed HTML Cache Hit** | CSE-5A identifies konnichiwa.nl, an eligible HTML document, the evidence period, and an explicit hit state or an HTML-document-specific hit ratio greater than zero for that document |
| **Confirmed HTML Cache Miss for Bounded Requests** | CSE-5A identifies the same four required fields (domain, HTML document(s), period, hit/miss state) and explicitly shows a miss/no-hit result for the tested, bounded requests |
| **Unconfirmed** | No CSE-5A was supplied, or what was supplied does not meet CSE-5A's four required fields (Section 3) |
| **Conflicting** | Two or more CSE-5A items **for the same layer, same document scope, and a materially comparable time window** disagree with each other (e.g., one export shows hits, another from an overlapping period shows none for the same document). Items from non-comparable, widely separated time windows are not "Conflicting" — each is recorded with its own date rather than treated as an unresolved disagreement. |

**A generic hit ratio covering assets, other domains, or unidentified traffic is insufficient for delivered-state confirmation** — such an item does not meet CSE-5A's requirements and is classified **Unconfirmed** on this axis, regardless of how favorable the blended number looks. **CSE-5B (a purge log) never establishes a value on this axis** — a purge log is configured-state-adjacent evidence only (Section 3); at most it corroborates that a cache-management mechanism exists, and is never read as confirming a hit.

### 6.3 Evidence Hierarchy (governs weighting, not substitution)

- **Tier 1 — Delivered-state evidence** (CSE-5A only): highest authority for the Delivered-State axis — the only item type that can establish Confirmed HTML Cache Hit.
- **Tier 2 — Direct configuration screenshots** (CSE-2 for WordPress full-page cache; CSE-3 for host/reverse-proxy; CSE-4 for CDN/edge): governs the Configured-State axis; describes intent, not confirmed delivery.
- **Tier 3 — CSE-1** (WordPress plugin list only): the weakest configured-state signal for the WordPress category — sufficient only to motivate requesting CSE-2, never to itself set Confirmed Enabled.
- **Configured-state-adjacent, not delivered-state — CSE-5B** (purge log): supports Configured-State reasoning only (evidence that cache management exists); never contributes to the Delivered-State axis.
- **Corroborating, not load-bearing — CSE-6** (provider written confirmation): raises or lowers confidence in a Tier-2 finding; never sufficient alone to set Confirmed Enabled or Confirmed HTML Cache Hit.

Per-axis Conflicting values (Sections 6.1, 6.2) already capture disagreement **within** an axis, narrowly scoped (Section 6.4). Cross-axis disagreement (configured says one thing, delivered says the opposite, for the **same** layer) is a distinct condition, handled as a Layer Contradiction in Section 6.4.

### 6.4 Narrow Definition of Contradiction (Layer Contradiction)

**CS-3 applies only when evidence conflicts for the same cache layer, the same relevant configuration scope, and a materially comparable time period.** A **Layer Contradiction** exists for a given in-scope category only when, within that same layer/scope/time window:

- Configured-State = Confirmed Disabled or Not Present Within Inspected Layer, **and** Delivered-State = Confirmed HTML Cache Hit (a layer reported as off/absent cannot, by direct evidence, also be observed delivering a hit — this pairing is logically incompatible and is flagged, not silently resolved); or
- Configured-State = Conflicting (Section 6.1); or
- Delivered-State = Conflicting (Section 6.2).

**Different layers legitimately differing from each other is never a Layer Contradiction.** For example: CDN/edge cache active while WordPress full-page cache is disabled; host/reverse-proxy cache active while no WordPress caching plugin exists; WordPress full-page cache active while the CDN caches static assets only (no HTML rule). These are **layered configurations** — normal, expected states of a multi-layer delivery path — and must never be routed to CS-3 merely because the three categories' results differ from one another.

**Configured Enabled + Confirmed HTML Cache Miss for Bounded Requests, for the same layer, is also not a Layer Contradiction** — see Section 6.5's corrected treatment; a cache being configured/enabled does not guarantee every individual tested request is a hit (e.g., TTL expiry, a purge shortly before the test, or the specific tested path being excluded from that layer's rules are all ordinary, non-contradictory explanations), so this combination is reported as its own informative state, not flagged as a conflict requiring resolution.

### 6.5 Corrected Per-Layer Combination Table

Evaluate each of the three in-scope categories (WordPress full-page cache, host/reverse-proxy page cache, CDN/edge cache) **independently first**, against this table. All three layer-level results are preserved and reported — none is discarded once the case-level outcome (Section 6.6) is derived.

| Configured-State | Delivered-State | Layer Result |
|---|---|---|
| Confirmed Enabled | Confirmed HTML Cache Hit | **CS-1 contribution** |
| Confirmed Enabled | Confirmed HTML Cache Miss for Bounded Requests | **"Configured Cache Confirmed — Delivered Miss Observed for Bounded Request(s)"** for this layer — **not a Layer Contradiction, not CS-3 by itself** (Section 6.4). The exact URL(s), request(s), and time of the tested, bounded request(s) are preserved verbatim in the report, together with the configured-enabled evidence, so the case owner can assess whether the miss reflects normal cache behavior (TTL expiry, recent purge, path exclusion) rather than a genuine fault. |
| Confirmed Enabled | Unconfirmed | **"Configured Cache Confirmed — Delivery Unconfirmed"** for this layer |
| Confirmed Enabled | Conflicting (within this layer, comparable time) | **Layer Contradiction** — routed to CS-3 |
| Confirmed Disabled | Confirmed HTML Cache Hit | **Layer Contradiction** — routed to CS-3 |
| Confirmed Disabled | Confirmed HTML Cache Miss / Unconfirmed | **CS-2 contribution** (negative, consistent) |
| Confirmed Disabled | Conflicting (within this layer, comparable time) | **Layer Contradiction** — routed to CS-3 |
| Not Present Within Inspected Layer | Confirmed HTML Cache Hit | **Layer Contradiction** — routed to CS-3 |
| Not Present Within Inspected Layer | Confirmed HTML Cache Miss / Unconfirmed | **CS-2 contribution** (negative, consistent) |
| Not Present Within Inspected Layer | Conflicting (within this layer, comparable time) | **Layer Contradiction** — routed to CS-3 |
| Unconfirmed | Confirmed HTML Cache Hit | **CS-1 contribution** (Tier-1 evidence is dispositive; configured state merely unknown, not opposing) |
| Unconfirmed | anything else | **CS-4 contribution** (incomplete layer coverage) |
| Conflicting (within this layer, comparable time) | anything | **Layer Contradiction** — routed to CS-3 |

### 6.6 Layer-First Aggregation → Bounded Overall Outcome

Order of operations, always: **(1) evaluate each of the three layers independently using Section 6.5; (2) preserve and report all three layer-level results, without discarding any; (3) only then derive the single bounded overall outcome**, using the priority order below.

1. **If any layer reaches a CS-1 contribution** (Confirmed HTML Cache Hit, with no Layer Contradiction for that same layer's delivered-state claim) — overall outcome is **CS-1 — Active HTML Cache Delivery Confirmed**. A Confirmed Disabled/Not-Present/other result at a **different** layer does **not** cancel this — one confirmed hit at one layer is sufficient regardless of the other two layers' states (layered configurations, Section 6.4).
2. **Else if any layer reaches a Layer Contradiction** (Section 6.4) — overall outcome is **CS-3 — Contradictory Evidence**, naming which specific layer(s) are implicated.
3. **Else if any layer reaches "Configured Cache Confirmed — Delivered Miss Observed for Bounded Request(s)"** — overall outcome is that named state for the implicated layer(s); pause for case-owner review (Section 6.7).
4. **Else if any layer reaches "Configured Cache Confirmed — Delivery Unconfirmed"** — overall outcome is that named state; pause for case-owner review.
5. **Else if all three layers reach a CS-2 contribution** — overall outcome is **CS-2 — No Configured HTML Cache Found Within Inspected Scope** (requires all three in-scope categories at Confirmed Disabled or Not Present, per Section 6.5).
6. **Otherwise** (e.g., one or more layers reach only a CS-4 contribution, incomplete coverage) — overall outcome is **CS-4 — Insufficient Evidence**.

### 6.7 Outcome Table (case-level, with routing)

| Outcome | Definition | Routing |
|---|---|---|
| **CS-1 — Active HTML Cache Delivery Confirmed** | Per Section 6.6, rule 1 | **Pause the OD-002 workstream.** Per Binding Selection Condition 6 and OD2-CAND-3's own Falsification Criteria, this is treated as potentially material new evidence against or narrowing diagnosis/OD-002-absence-of-html-caching-layer.md's established formulation, and is routed to case-owner and lifecycle review (DD-022 Common Condition 10) before any further Design-stage step. **OD2-CAND-2 (Stage 2) does not start automatically.** |
| **CS-3 — Contradictory Evidence** | Per Section 6.6, rule 2 | Recorded explicitly as **unresolved**, naming the specific layer(s) implicated, not defaulted to CS-1 or CS-2. Flagged for case-owner review on whether further, still read-only clarification is worth requesting. **Does not start Stage 2.** |
| **Configured Cache Confirmed — Delivered Miss Observed for Bounded Request(s)** | Per Section 6.6, rule 3 | **This is not CS-1.** The exact URL/request/time evidence is preserved and reported verbatim; the layer is reported as configured but the specific bounded request(s) were not observed as a hit. **Pause for case-owner review** of whether the miss reflects ordinary cache behavior or warrants further, still read-only clarification. **Does not start Stage 2 automatically.** |
| **Configured Cache Confirmed — Delivery Unconfirmed** | Per Section 6.6, rule 4 | **Pause for case-owner review** — this is explicitly **not** CS-1; a configured setting alone never confirms delivery (Section 6.0). Case owner decides whether to request additional, still read-only delivered-state evidence (CSE-5A) before further action. **Does not start Stage 2.** |
| **CS-2 — No Configured HTML Cache Found Within Inspected Scope** | Per Section 6.6, rule 5 | Recorded as a **bounded, scope-limited** negative finding — "no configured HTML cache found within this inspected scope," **never** generalized to "Konnichiwa has no caching" as an established infrastructure fact (Section 5; Binding Selection Condition 7). **Does not automatically start OD2-CAND-2 (Stage 2)** — a new, explicit case-owner authorization is required regardless of this outcome (Condition 8). |
| **CS-4 — Insufficient Evidence** | Per Section 6.6, rule 6 | Recorded as a **legitimate, closed-for-now** outcome, consistent with this case's own precedent of accepting Evidence Insufficient as a legitimate result (decisions/DD-019, DD-020). Does not imply caching is present or absent. Stage 1 remains open for future evidence if Kelvin later supplies more. **Does not start Stage 2.** |

**No outcome above automatically authorizes or begins OD2-CAND-2 (Stage 2).** Every outcome, without exception, requires its own fresh, explicit case-owner decision — per decisions/DD-025 Binding Selection Condition 8 — before Stage 2 may begin. **Evidence from different cache layers is never treated as contradictory merely because their configured or delivered states differ from one another** (Section 6.4) — all three layer-level results are always reported alongside the bounded overall outcome, never collapsed into a single figure without their individual layer context.

---

## 7. What This Specification Does Not Do

- Does not inspect any hosting, WordPress, CDN, or cache system.
- Does not collect any screenshot, export, or evidence item listed in Section 3.
- Does not modify any configuration, plugin setting, or server setting.
- Does not start OD2-CAND-2 (Stage 2) or any Transformation.
- Does not request, access, or store any credential, password, API key, token, cookie, or unrestricted account access.
- Does not conclude, imply, or pre-classify a CS outcome — Section 6 registers the possible outcomes and their routing; it does not apply any of them.

## 8. Required Case-Owner Approval Before Evidence Collection

This specification, once recorded, does **not** by itself authorize Kelvin or anyone to begin supplying the Section 3 evidence items. Bounded evidence collection under this specification requires Kelvin's explicit approval — e.g., **"APPROVED FOR BOUNDED EVIDENCE COLLECTION"**, optionally naming which of CSE-1 through CSE-6 to prioritize or skip — given as a separate, later instruction. Until then, this specification remains a design artifact only.

```yaml
od_002_cand3_specification_status: Prepared — Evidence Collection Not Approved
od_002_cand3_evidence_collection_approved: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

## Design Boundary

No evidence collection, system inspection, or configuration action is authorized by this specification. This document defines what would be needed and how it could be supplied; it does not perform any of it. Any future bounded evidence collection under this specification requires Kelvin's separate, explicit approval (Section 8); any confirmed active cache (CS-1) requires a separate lifecycle/case-owner review before Design proceeds further; starting OD2-CAND-2 (Stage 2) requires a new, separate, explicit case-owner authorization regardless of this specification's eventual outcome; any eventual Transformation requires its own, later Transformation Authorization Gate, not implied or pre-approved here.
