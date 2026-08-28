# HV-CSD-001 — Consent-State Divergence (Consent Architecture Root-Cause Finding)
---

## Status

**Preliminary measurement-engineering finding, registered by Case Owner authorization (22 August 2026).** This is **not** a formal Diagnosis Question (DQ) investigation and has **not** passed an Independent Diagnosis Establishment Gate, unlike diagnosis/DQ-001–007 and diagnosis/OD-001–003 in this same folder. It may inform, but does not itself establish, an Organizational Diagnosis. No design or intervention is authorized by this finding. It is registered here (rather than only in measurement/) because its content is diagnostic in shape (root cause, competing explanations, verdict), consistent with this folder's purpose, while its authority level is explicitly lower than a gated OD.

**Update, 23 August 2026 (EV-034/EV-035, see "New Finding" section below):** the Option C bridge described in this document's Architecture Recommendation has since been implemented and deployed to production, outside the scope of any decision recorded in this repository. Production validation of that deployed bridge failed — Google Consent Mode `update` values remain `undefined` after both a real Complianz Accept and a manually-dispatched `cmplz_status_change` event. A read-only investigation found the deployed bridge's source does not exist anywhere in this case's version-controlled theme repository or in any locally-installed plugin, so a code-level root cause could not be confirmed from that environment alone.

**Update, 24 August 2026 (EV-036/EV-037, observations/O-017.md):** the Case Owner confirmed the bridge was hand-written into `header.php` and uploaded to production via FileZilla, outside git, and supplied the production file directly for comparison. **Root cause is now confirmed, from direct reading of the deployed source: the bridge's three `addEventListener` calls are registered on `window`, but the consent-status event is targeted at `document` and is non-bubbling — per the WHATWG DOM event-propagation rule, a `window`-level, default (bubble-phase, non-capturing) listener structurally cannot receive a non-bubbling event dispatched on `document`.** This is not a timing issue, not a Complianz configuration issue, and not an exception — see "New Finding" section below for the full analysis and the exact minimal corrective diff. **No production, WordPress, or repository change has been made. Case Owner decision required — see below.**

**Status, 26 August 2026: CLOSED — Root Cause Confirmed and Corrected, Fix Validated End-to-End in Production (observations/O-017.md, EV-034–EV-041).** See the "New Finding" section below for the full validation record. **Repository reconciliation, 26 August 2026 (observations/O-017.md, EV-042): also complete** — the validated fix was independently re-confirmed live in production, then committed and pushed to `origin/main` as `c9f6a5681ca7885e7ca12b1fb3a2a2ce49bc2745`, isolated from an unrelated, pre-existing local-repository divergence that was not touched. This closure and the repository reconciliation are recorded as distinct events on the same day, not implied to be simultaneous — see EV-042 for the full sequence and boundary.

## Condition Investigated

Why does accepting consent through the visible Complianz banner not result in a verified Google Consent Mode `update` to `granted`, despite Complianz's own public documentation stating this integration is automatic and requires no further setup?

## Evidence Base

observations/O-014.md (EV-025–EV-028, static code and public-container inspection); observations/O-015.md (EV-029–EV-031, browser-executed verification and Complianz public documentation; EV-032, authenticated Complianz Wizard configuration screenshot, 22 August 2026; EV-033, confirmed live GTM double-loading, 22 August 2026).

## Current Consent Architecture

Two independently-operating consent mechanisms exist in production:

1. **Custom (header.php):** structurally correct Google Consent Mode v2 implementation — sets `gtag('consent','default',...)` (all denied) before GTM loads; its own `#cookie-banner` UI calls `gtag('consent','update',...)` on Accept/Decline via `konnichiwa_consent` (localStorage).
2. **Complianz (free edition, confirmed via EV-031 — Premium not installed):** manages its own, separate state (`cmplz_*` cookies, `cmplz_event_*` dataLayer pushes). Zero references to `gtag(`, `'consent'`, `analytics_storage`, or `konnichiwa_consent` found anywhere in its publicly-served frontend bundle (EV-028), and zero references to `cmplz` found in the published GTM container (EV-026).

## Exact Observed Break in the Chain

```
Complianz Accept (live, browser-confirmed, EV-030)
→ cmplz cookies set to allow                                         ✅ confirmed
→ cmplz_event_marketing / statistics / preferences fire               ✅ confirmed
→ [BREAK — no bridge evidenced anywhere: not in theme code, not in
   mu-plugins, not in Complianz's own served JS, not in the published
   GTM container]
→ gtag('consent','update',...)                                        ❌ never called
→ google_tag_data.ics.entries.analytics_storage.update = undefined    ✅ confirmed directly (EV-030) — Google's own internal state object, stronger evidence than a dataLayer log
→ analytics_storage remains at its 'default' value: denied
→ GA4 collect request                                                 ❌ not observed
```

## Competing Explanations

| # | Explanation | Supporting evidence | Contradicting evidence | Confidence | Falsified by |
|---|---|---|---|---|---|
| A | Complianz's Consent Mode v2 integration exists in the plugin but is not enabled/configured for this site | EV-031: plugin documents automatic integration "no further set-up needed"; EV-030/EV-028 show zero evidence of it operating; EV-031 free-tier auto-detection may never have registered GTM-WXH5P6SN as a service | Cannot confirm site-specific settings without authenticated access | **High** | Authenticated inspection of Complianz's own settings (see Case Owner instructions below) |
| B | No GTM-side bridge exists to translate `cmplz_event_*` into a consent update | EV-026: zero "cmplz" references in the published GTM container | No authenticated GTM trigger/tag inspection performed | **High** | Authenticated GTM workspace inspection |
| C | Custom consent code conflicts with/overrides Complianz | Both systems run in parallel | EV-030 shows the custom system's own default value is simply left untouched, not overridden — consistent with two disconnected systems, not a conflict | **Low** | Evidence Complianz actively suppresses the custom banner's execution (not found) |
| D | An update occurs via another mechanism not yet observed | Theoretically possible | EV-030's `google_tag_data.ics.entries` reading is Google's own internal state, not a log — it would reflect an update from any source; it shows `undefined` | **Low** | Retest with longer wait, re-read the same object |
| E | The test missed a delayed update (timing) | Only a short wait was used | `cmplz_event_*` fires synchronously on click; no GA4 request appeared at all | **Low–Medium** | Retest with 30–60s wait |

## Root-Cause Verdict (revised 22 August 2026, EV-032/EV-033)

**Confirmed, High confidence.** Direct, authenticated, site-specific configuration evidence (EV-032: Complianz Wizard → Consent → Statistics, "Google Consent Mode V2: No", marked "Upgrade" in the UI) converges exactly with public product documentation (EV-031 addendum: Complianz's own readme.txt lists "Google Consent Mode" explicitly under `== Premium Features ==`) and the confirmed installed edition (free only, Premium plugin folder 404). **Root cause is no longer inferred — it is directly evidenced: Google Consent Mode v2 integration is a Premium-only feature in Complianz, this site runs the free edition, and the feature is therefore structurally unavailable without an upgrade.** This supersedes the previous "Medium confidence" framing for the deeper cause; Explanation A (from the original competing-explanations table) is now **Confirmed**, not merely High-confidence-inferred. Explanations B–E are unaffected (still Low confidence / superseded by this more direct finding).

## New Finding — GTM Double-Loading (EV-033, independent of the consent-bridge question)

Confirmed live: GTM (container GTM-WXH5P6SN) loads **twice** on the production homepage — once via the theme's own `header.php` snippet, once via Complianz's auto-injected "Statistics script" (`<script data-category="functional">`, corresponding to EV-032's "Add Google Tag Manager: Yes" setting). This is a **separate technical defect from the consent-bridge gap** — it exists regardless of which architecture option is chosen, and is plausibly, though not independently confirmed here, contributing to duplicate tag-firing risk (e.g. inflated GA4 pageview/session counts) given two independent `gtm.start`/`dataLayer` initialization cycles. Notably, this duplicate load is tagged `data-category="functional"` — by common GDPR-plugin convention this category is typically exempt from Complianz's own consent-gating, meaning this second GTM load most likely executes unconditionally regardless of visitor consent choice (inferred from convention, not authenticated-confirmed).

## New Finding — Option C Bridge Deployed to Production, Failing Validation; Root Cause Confirmed 24 August 2026 (EV-034–EV-037)

**Evidence base:** observations/O-016.md.

**What is now confirmed working:** the GTM double-loading fix identified alongside this document's original Architecture Recommendation is applied and confirmed effective — Complianz's own "Add Google Tag Manager" is now set to No, and production shows exactly one GTM script tag and one `gtm.js` bootstrap (EV-034, items 1–3).

**What is now confirmed broken:** a custom bridge matching the Option C design (a function named `propagateConsent()`, calling `gtag('consent','update',...)`) is deployed and present on the production page, but does not produce a working consent update. After a real Complianz Accept, `cmplz_has_consent('statistics')` and `cmplz_has_consent('marketing')` both correctly report `true`, yet all four Google Consent Mode `update` values remain `undefined` (EV-034, items 5–8). Critically, manually dispatching `document.dispatchEvent(new CustomEvent('cmplz_status_change'))` — a deterministic test independent of Complianz's own internal firing behavior — **also** leaves all four values `undefined` (EV-034, item 9). This isolates the defect to somewhere between "the bridge's event handler runs" and "the `gtag('consent','update',...)` call takes effect"; it rules out "Complianz never fires the event" as a sufficient explanation on its own.

**Traceability gap (EV-035):** a read-only inspection of this case's git-tracked theme repository (`github.com/bkwhello/konnichiwa`, both HEAD and uncommitted working-tree state) and this machine's locally-installed WordPress plugins found **no trace of `propagateConsent`, `cmplz_has_consent`, or `cmplz_status_change` anywhere** — not in `header.php`, not in any other theme file, not in any commit, not in any locally-installed plugin (Complianz itself is not installed in this local WordPress copy at all). The theme's only consent code, in both the committed and current working-tree state, is the original custom `localStorage`/`#cookie-banner` implementation already described above under "Current Consent Architecture," item 1 — unchanged. **The deployed bridge that EV-034 confirms is running in production exists nowhere in this investigation's reach.** It was added to production through a channel outside this repository — most plausibly a direct production-only file edit, or a database-stored custom-code field — and cannot currently be code-reviewed, diffed, or version-controlled from here.

**Root-Cause Verdict on the bridge defect (revised 24 August 2026, EV-036/EV-037): Confirmed, High confidence.** Direct reading of the production-supplied source (observations/O-017.md, EV-036) shows the exact deployed implementation:

```js
(function () {
    function propagateConsent() {
        gtag('consent', 'update', {
            'analytics_storage': window.cmplz_has_consent('statistics') ? 'granted' : 'denied',
            'ad_storage': window.cmplz_has_consent('marketing') ? 'granted' : 'denied',
            'ad_user_data': window.cmplz_has_consent('marketing') ? 'granted' : 'denied',
            'ad_personalization': window.cmplz_has_consent('marketing') ? 'granted' : 'denied'
        });
    }

    window.addEventListener('cmplz_status_change', propagateConsent);
    window.addEventListener('cmplz_enable_category', propagateConsent);
    window.addEventListener('cmplz_revoke', propagateConsent);
})();
```

**The defect is an event-target/bubbling mismatch, not a timing, scope, or logic defect.** The three listeners are attached to `window`, using default (bubble-phase, non-capturing) options. Per the WHATWG DOM standard, `document`'s only ancestor in the event-propagation path is `window` — reachable by a `window`-level listener only via the event's bubble phase (requires the dispatched event to have `bubbles: true`) or via a capture-phase listener (`{capture:true}`, not used here). `new CustomEvent('cmplz_status_change')` defaults `bubbles` to `false`. Kelvin's own manual test (observations/O-016.md, EV-034, item 9) dispatched exactly `document.dispatchEvent(new CustomEvent('cmplz_status_change'))` — target `document`, non-bubbling — which structurally never reaches a `window`-level listener. This deterministically explains the manual-test failure, and — since Complianz's own documented third-party-integration pattern (cited in the deployed code's own comment) instructs integrators to listen via `document.addEventListener`, matching how the manual test was evidently modeled — plausibly explains the real-Accept-click failure identically, without requiring two separate defects.

Ruled out by direct inspection of this same source (observations/O-017.md, EV-037): `gtag` scope (declared globally before this block runs, in document order), a guard/conditional blocking execution (none exists), and an argument/key-name mismatch (the four keys match Google's documented Consent Mode v2 names exactly — moot in any case, since the function is never invoked at all, not invoked-with-wrong-arguments). Not ruled out, but not needed to explain the observed symptom: whether `window.cmplz_has_consent` reliably exists as a global at call time (a secondary, unconfirmed risk, distinct from the confirmed root cause).

**New, previously unreported finding (EV-036):** deploying the bridge also **removed the original custom `#cookie-banner` fallback UI entirely** (its CSS, markup, and `localStorage`-based accept/decline script), replacing it with a comment stating Complianz is "now the sole visible consent UI and sole consent-state owner." This was not previously reported to this case. It means the site currently has **no independent consent UI or state-write path if Complianz is ever deactivated, fails to load, or is misconfigured** — a rollback/dependency consideration beyond the immediate bridge defect, not evaluated or authorized by any prior Case Owner decision on record.

**Exact proposed corrective diff (production `header.php`, consent-bridge block only — not applied):**

```diff
-            window.addEventListener('cmplz_status_change', propagateConsent);
-            window.addEventListener('cmplz_enable_category', propagateConsent);
-            window.addEventListener('cmplz_revoke', propagateConsent);
+            document.addEventListener('cmplz_status_change', propagateConsent);
+            document.addEventListener('cmplz_enable_category', propagateConsent);
+            document.addEventListener('cmplz_revoke', propagateConsent);
```

Three tokens changed (`window` → `document`), no other line touched — `propagateConsent()`'s own body, the `gtag` calls, and the `cmplz_has_consent` reads are left exactly as deployed. This is the smallest change that resolves the confirmed defect: it makes the listener a target-phase listener on the same node the event is actually dispatched at, which fires regardless of the event's `bubbles` setting. **Not applied to production or to the repository — proposal only, pending Case Owner authorization.**

**Validation implications if this diff is later authorized and applied:**
1. Re-run Kelvin's exact manual test (`document.dispatchEvent(new CustomEvent('cmplz_status_change'))`) — now targets the same node the fixed listener is on; expected to succeed (AT_TARGET phase always fires, independent of `bubbles`).
2. Repeat the full EV-034 Accept-path sequence: fresh visit → confirm pre-consent defaults unchanged (`denied`/`undefined`) → Accept → confirm all four `update` values become `granted`.
3. **Not yet tested in any round:** the Decline/Reject path — confirm values correctly remain/become `denied`. Flagged as an open gap in observations/O-017.md.
4. Confirm the GTM single-load fix (EV-033/EV-034) is unaffected — this diff does not touch that code.
5. Re-verify `window.cmplz_has_consent` is defined at call time in practice (the one not-fully-ruled-out secondary risk, EV-037) — if it throws, the same symptom could partially recur even after this fix; recommend confirming with the browser console open during re-test, not adding speculative guard code ahead of that confirmation.
6. Separately (not blocking this diff): a Case Owner decision on whether the removed custom `#cookie-banner` fallback (EV-036) should be restored, intentionally retired, or replaced with some other fallback if Complianz is ever unavailable.

**Rollback impact:** reverting this one-line-per-call change (`document` → `window`) is trivial and immediate. The bridge is currently a confirmed no-op with respect to Google Consent Mode, so applying the fix and having it still fail would leave the site no worse than its current, already-broken state. A successful fix affects only whether `gtag('consent','update',...)` fires — analytics/ads measurement only, not layout, navigation, or the booking widget (none of which this diff touches).

**Case Owner Decision, 24 August 2026 (recorded in full in current.md):** all four points above resolved — (1) the three-token diff is **authorized**, scoped exactly to the three `addEventListener` calls, no other code/GTM/Complianz/GA4 change authorized; (2) repository commit **explicitly deferred** until after full production validation passes, then reconciled against `HEAD` and the separate uncommitted nav/logo changes before any commit — not authorized yet; (3) the retired custom `#cookie-banner` fallback **stays retired**, not restored — target architecture is confirmed as one visible consent UI (Complianz), one authoritative consent state (Complianz), one propagation bridge (Complianz → Google Consent Mode v2), one GTM loader (theme); (4) a six-scenario validation matrix (fresh visitor, Accept, Decline, returning-visitor-accepted, returning-visitor-declined, revoke) is required before closure — see transformation/HV-IR-001.md, HV-INT-006 for the full protocol and status.

**Update, 24 August 2026 (EV-038):** Kelvin deployed the fix and ran scenarios A–C. **All three PASS** — the Accept and Deny paths both now correctly produce `gtag('consent','update',...)` calls (all four values `true` on Accept, all four `false` on Deny), confirming the EV-037 root cause. **Not yet run:** D (returning-accepted), E (returning-denied), F (revoke), and the measurement-behaviour (GA4) check — HV-CSD-001 stays open until those complete (Case Owner instruction, 24 August 2026). See transformation/HV-IR-001.md, HV-INT-006 for the live status table and the protocol for the remaining scenarios.

**Update, 24 August 2026 (EV-039):** scenarios D (returning-accepted), E (returning-denied), and F (revoke) all **PASS** — the corrected `document.addEventListener` registration propagates consent correctly across reload and revocation, not only the initial Accept/Deny click. Root cause (EV-037) unchanged, not broadened. Sole remaining gate at that point: end-to-end GA4/measurement-behaviour validation.

**Update, 26 August 2026 (EV-041) — GATE SATISFIED, STATUS: RESOLVED.** The measurement-behaviour gate is complete: GA4 measurement was confirmed consistent with the propagated consent state across all three required states — Accepted (granted, `page_view` measured), Denied (consent-restricted/cookieless ping, `gcs=G100`/`npa=1`), and Revoked (returns to the same restricted state after withdrawal). No duplicate GA4 measurement attributable to the earlier double-GTM defect was observed in any state. **This satisfies every scenario in the required validation matrix (A–F, plus the measurement gate) — no gate remains open.**

**Final verdict:** the root cause identified in EV-037 (bridge listeners registered on `window` instead of `document`, unreachable for the non-bubbling `document`-targeted consent event) is **confirmed**, and the three-token corrective diff (`window`→`document`) is **confirmed effective end-to-end in production** — from the initial consent-mode propagation through to actual GA4 measurement behaviour, across every required consent state. **HV-CSD-001 is CLOSED — Root Cause Confirmed and Corrected, Fix Validated End-to-End in Production.** This diagnosis remains narrowly scoped to consent-mode propagation and its measurement consequence, as instructed — it is not broadened to any other claim (e.g. overall analytics data quality, SEO/traffic impact, or the separate console error below). An unrelated console error (`TypeError: section.querySelectorAll is not a function`, observations/O-017.md EV-040) was observed during testing and remains explicitly excluded from this diagnosis, registered only as an independent follow-up candidate.

**Repository reconciliation, completed separately (26 August 2026, observations/O-017.md, EV-042):** the validated, corrected `header.php` (plus its required `build/index.css` changes) is now committed and pushed to this case's git-tracked theme repository — `origin/main` = `c9f6a5681ca7885e7ca12b1fb3a2a2ce49bc2745`, a clean fast-forward from `b142905ff8b1509cf37d38a2ac204c0668ebe94f`, isolated via a dedicated worktree/branch specifically to avoid entangling an unrelated, pre-existing local-repository divergence (two local-only commits duplicating already-pushed wagyu/sake work). That divergence, and the existing uncommitted working-tree changes (language-switcher, `.footer__social` CSS, unrelated page templates), remain a **separate, unresolved workstream**, intentionally not touched here — see EV-042 for the full boundary.

**Execution note:** Claude has no FTP, WordPress-admin, or browser-automation access in this environment. The corrected file (production `header.php` with only the authorized three-token change applied) has been prepared read-only in a local scratch location for Kelvin's review and upload — not committed to this repository, not transmitted to production by Claude. Upload via FileZilla and execution of the six-scenario validation matrix remain Kelvin's actions, consistent with every prior browser/production evidence item in this case (observations/O-014.md–O-016.md, all collected via "manual browser test, Kelvin"). Results, once reported, will be recorded here and in transformation/HV-IR-001.md as the next dated evidence entry.

## Remaining Unknown — Production Complianz Configuration

- Exact installed/active version (EV-031 confirms only the latest documented stable tag, 7.5.3.1 — not necessarily what is running).
- ~~Edition~~ — **confirmed free tier** (Premium plugin folder returns 404, EV-031; corroborated by the Upgrade badge, EV-032).
- ~~Whether Google Consent Mode integration is enabled~~ — **confirmed: No** (EV-032).
- Whether Complianz's own "Statistics" service configuration lists/recognizes Google Analytics (G-C29ZMF288W) specifically, beyond the confirmed GTM container entry.
- Whether upgrading to Premium would, in practice, close the gap (not tested — no purchase/upgrade was performed).
- Whether Complianz was ever intended, by design, to own Google consent-signal propagation on this site, or whether that was always meant to sit with the custom code (still no design decision on record either way).

## Architecture Recommendation (revised 22 August 2026 — pending Case Owner decision, not authorized for implementation)

The Case Owner's original decision rule (item 8) preferred Option A "if native Complianz Google Consent Mode v2 support is available and suitable." Evidence now shows the capability is **technically available but requires a paid upgrade** — a materially different situation from "already active and free to use." This changes the comparison from a purely technical one into one with a genuine cost/licensing dimension, which is a business decision for the Case Owner, not a technical determination I can make unilaterally.

| Dimension | Option A — Complianz sole authority (requires Premium upgrade) | Option C — explicit bridge (stays on free edition) |
|---|---|---|
| **Risk** | Low technical risk once purchased and configured — uses a vendor-maintained, "Google-certified CMP" integration rather than custom code | Low-Medium — small custom script, but it is bespoke code this case must maintain and re-verify after any Complianz update |
| **Onderhoud (maintenance)** | Lower ongoing burden — Complianz's own team maintains the Consent Mode integration as the Google Consent Mode API evolves | Higher — the bridge script must be manually kept in sync if Complianz renames its `cmplz_event_*` categories/events in a future update |
| **Kosten/licentie-afhankelijkheid** | **New, real recurring cost** — requires purchasing Complianz Premium (price/tier not established in this investigation); introduces an ongoing vendor/licensing dependency | **No cost** — works entirely within the currently-installed free edition |
| **Dubbele GTM-loading** | Naturally resolved as part of the same remediation: since Complianz already adds GTM itself, the theme's own duplicate `header.php` snippet could be removed once Complianz is confirmed to own this responsibility | **Not resolved by Option C alone** — this is an orthogonal problem; either the theme's snippet or Complianz's own "Add Google Tag Manager" setting should be turned off regardless of which consent option is chosen (a separate, free, low-risk fix available today) |
| **Rollback** | Straightforward if the Premium subscription is cancelled — but Consent Mode integration would then revert to disabled, re-creating today's gap unless the custom code is restored first | Straightforward — a single, isolated code addition in `header.php`, easily reverted |

**Revised recommendation:** the underlying technical design for Option C (an explicit bridge listening for `cmplz_event_marketing`/`cmplz_event_statistics` and calling `gtag('consent','update',...)`) remains the lower-risk, no-cost path and requires no business/purchasing decision. Option A is now confirmed genuinely available, but only at the cost of a Complianz Premium upgrade — whether that expense is worthwhile (e.g. for its other bundled features: Records of Consent, Geo IP banners, TCF v2.0) is a business question for the Case Owner, not something this investigation resolves. **Independent of that choice, the GTM double-loading fix (turning off either the theme's snippet or Complianz's "Add Google Tag Manager" setting) is a free, low-risk action available immediately, and is not blocked on the Option A/C decision.**

## What This Finding Does Not Establish

Legal/GDPR compliance status — **Privacy / Compliance Status remains UNRESOLVED** (unchanged from observations/O-014.md). This finding concerns measurement architecture and consent-state propagation only. No design, intervention, or production change is authorized by this finding.

## Traceability

observations/O-014.md, observations/O-015.md, observations/O-016.md (EV-034/EV-035, 23 August 2026 — production validation failure and repository traceability gap), observations/O-017.md (EV-036/EV-037, 24 August 2026 — production header.php retrieval and confirmed root cause), transformation/HV-IR-001.md (HV-INT-006), Challenge Evidence/CR-register.md (CR-008). Case Owner authorization: EC-002 — Case Owner Decision, Consent Architecture Investigation, 22 August 2026; EC-002 — Case Owner Instruction, Stop Validation Matrix and Investigate Read-Only, 23 August 2026; EC-002 — Case Owner Decision, Production header.php Supplied for Comparison, 24 August 2026.
