# HELIX Claude Entry Commands

## `visibility` — enter EC-002

Treat any of the following as a command to enter the existing HELIX Visibility
engineering case:

- the user's message is exactly `visibility` (ignoring surrounding whitespace
  and letter case); or
- the user clearly asks to open, enter, resume, or continue visibility.

Do not interpret this command as a generic marketing request and do not create a
new project or engineering case. Enter:

- **Capability:** Marketing → Visibility
- **Engineering case:** EC-002 — Konnichiwa Organic Visibility Growth
- **Case root:**
  `organization/capabilities/marketing/visibility/cases/EC-002-konnichiwa-organic-visibility/`

### Entry procedure

Before proposing or continuing work:

1. Read all applicable repository and case governance. At minimum, read this
   file, the case `README.md`, `current.md`, and `decisions/DD-002-approval-safety-rules.md`.
   Read `decisions/DD-006-claude-execution-prompt.md` for the authorized EC-002
   method and operating constraints.
2. If Git metadata is available, inspect and report the current branch, HEAD,
   and working-tree status. Preserve unrelated and uncommitted changes. If Git
   metadata is unavailable, state that explicitly; never invent repository
   state.
3. Reconstruct the authoritative current case state from repository artifacts,
   rather than relying on chat memory. Start with `current.md`, then inspect at
   least:
   - the latest weekly visibility brief or operating-loop record, if one exists;
   - `measurement/HV-MP-001.md`;
   - `measurement/HV-DB-001.md`;
   - `transformation/HV-IR-001.md`;
   - the latest records in `observations/`;
   - `Challenge Evidence/CR-register.md` and active challenge evidence;
   - the latest relevant artifacts in `claims/`, `understanding/`, `diagnosis/`,
     and `design/`;
   - active decisions in `decisions/`;
   - `work-objects/WO-active-register.md`.
4. Reconcile conflicting or stale summaries by preferring the most recently
   updated evidence-backed artifact and preserving the conflict as an explicit
   uncertainty. Keep observation, evidence, claim, diagnosis, design,
   transformation, and evaluation states distinct.
5. Determine and briefly report the current lifecycle stage, active priorities,
   blockers, overdue validations, pending approvals, unresolved evidence gaps,
   and the next scheduled measurement or review.
6. Continue from the next valid HELIX step already authorized by the repository.
   Do not restart case establishment, repeat completed work, fabricate missing
   evidence, or skip required diagnosis, challenge, validation, or approval
   gates.

### Approval boundary

Entering or continuing EC-002 never grants approval for an external or
production change. Follow `decisions/DD-002-approval-safety-rules.md`: obtain
explicit human approval before live website/profile edits, analytics changes,
public communication, purchases, review activity, outreach, or removal of
production functionality. Read-only inspection, drafts, local repository
changes, and proposed diffs remain allowed. Never commit or push unless the user
explicitly approves that action.

### Entry response

After reconstructing state, identify the case as EC-002 and give a concise
state-based handoff: repository state, current lifecycle position, material
blockers/approvals, and the next valid HELIX action. Then proceed with that
action when it is locally authorized and safe.

