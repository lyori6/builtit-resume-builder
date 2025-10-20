# Public Launch Implementation Plan

Tech-lead view of everything required to open the resume builder to the public while keeping the experience approachable for ordinary users. Track progress by ticking checkboxes as work lands; update notes inline when context changes.

## How To Use This Plan
- Update checkboxes directly in this file after each task is delivered.
- Add dates/owners in parentheses beside items once work is staffed.
- Document newly discovered issues or decisions beneath the relevant section so the plan stays authoritative.

## Step-by-Step Execution Roadmap
1. **Onboarding Wizard (Week 1)** – ✅ Guided setup shipped (Gemini key instructions, free/local messaging, Rx Resume tip). Track polish items (copy tweaks, analytics, screenshots) as they emerge.
2. **Intake UX Enhancements (Week 1-2)** – Design branching intake (JSON vs. need help) with improved key messaging, then iterate on copy.
3. **Workspace & Error Polish (Week 2)** – Align error copy across convert/optimize/adjust flows with shared retry guidance, ship the diff summary banner with launch-ready language, and add the “Download optimized JSON” CTA beside the summary.
4. **Launch Messaging & Validation (Week 2-3)** – Draft launch-day copy reiterating privacy/zero-cost promises, capture pilot quotes/metrics, run the end-to-end manual smoke checklist, and record findings in this document before announcing GA.

---

### Latest Engineering Updates (2025-10-19)
- Restored the lint baseline by upgrading `eslint-config-next` to match Next 14.2 and tightening TypeScript coverage across `app/page.tsx`, `WorkspaceActions`, and storage helpers.
- Confirmed the production build succeeds (Next.js type checks) after refining `lib/resume-types.ts` summary handling.
- Unblocked UX polish work by documenting progressive disclosure and workspace status header refinements under the intake/workspace follow-up sections.
- Added deterministic `data-testid` hooks and shared Playwright helpers so the intake flow is scriptable without depending on visible copy.
- Introduced a lightweight `tsx --test` unit suite covering `validateResumeJSON` edge cases and local-storage behavior; prompt builder coverage remains on deck.
- Replaced the full Playwright regression pack with a single smoke flow that verifies JSON intake + workspace load, keeping the suite fast and reliable.

## Phase 0 · Discovery & Alignment
- [ ] Confirm target personas (ordinary job seeker, founder/advanced) and primary success metrics for public launch.
- [ ] Collect sample plaintext resumes to benchmark conversion accuracy.
- [ ] Draft onboarding copy (Gemini key instructions, privacy notes, conversion tips).
- [ ] Finalize decision on deterministic parsing fallback vs. Gemini-only conversion.
- [ ] Identify legal/compliance requirements (privacy statement, terms update if any).

## Phase 1 · Key Management & Storage Foundation
- [x] Create `lib/local-storage.ts` helper with namespaced getters/setters, versioning, and clear-all utility.
- [x] Implement onboarding wizard/modal component outlining Gemini free-tier usage, zero-cost promise, key handling, and deletion flow (links to API key signup + Rx Resume recommendation).
- [x] Build `app/api/check-key/route.ts` to validate user-supplied Gemini keys (no logging; handle quota/auth errors gracefully).
- [x] Wire client-side key entry UI to store keys in `localStorage`, surface success/error states, and expose delete/reset actions. _(Key setup card shipped; upgrade to multi-step wizard still pending.)_
- [x] Update documentation with detailed Gemini key instructions (`README.md`, `docs/gemini-key-setup.md`).

## Phase 2 · Resume Intake Experience
- [x] Upgrade `validateResumeJSON` to perform deep schema checks with descriptive errors. _(Covers basics, section metadata, and core item requirements.)_
- [x] Enhance JSON upload path: inline validation feedback, success state, “download current JSON” control. _(Added download action + helper copy.)_
- [x] Build text intake UI (textarea, guidance, loading/error states). _(Toggle between JSON/Text intake with validation messaging.)_
- [x] Implement `app/api/convert-resume/route.ts` using Gemini 2.5 Pro (via user key) to transform text → JSON; centralize prompt template in `lib/prompts.ts`.
- [x] Cache a single custom resume in local storage for quick reload + download. _(Intentionally scoped to one-at-a-time flow for MVP.)_
- [x] Provide sample JSON templates and links to “generate via your favorite AI” instructions. _(See `docs/resume-json-template.md` and onboarding copy.)_
- [x] Embed JSON template prompt helper directly in the intake UI (copy-to-clipboard action + sample JSON preview toggle).
- [x] Include the full JSON template (with optional sections) in AI copy helpers to reduce invalid schema outputs.
- [x] Add tooltip next to JSON intake tab with recommended AI prompt and optional “Try Rx Resume” callout for generating a baseline JSON export.
- [x] Add decision screen that asks “Do you already have a JSON resume?” with clear branching into JSON import vs. “help me generate one.” _(MVP routing landed; polish copy/visual hierarchy after upload & helper flows ship.)_
- [x] Support drag-and-drop/upload for JSON import alongside paste flow (single resume retained locally). _(Drop zone, inline validation, and local persistence shipped.)_
- [x] Build guided “No JSON yet” path with inline template + one-click prompt copy and CTA to let BuiltIt convert pasted text. _(Prompt helper + conversion card live; iterate on copy via pilot feedback.)_
- [x] Update intake flow to defer Gemini key request until the user starts a conversion or optimization step, keeping messaging contextual. _(Key guidance now shown inline; entry field appears once users proceed to conversion/workspace.)_
- [x] Surface inline Gemini key entry inside the conversion helper so users can capture/save their key without leaving the flow.

## Phase 3 · Workspace & Prompt Controls
- [ ] Refactor `app/page.tsx` into logical child components (key setup, intake, workspace dashboard, diff summary, adjustment panel). _(Key setup/intake/workspace actions split; resume preview + diff table now live in dedicated components.)_
- _Next increment_: wire new components fully and add diff-summary banner + improved prompt copy once preview modularization settles.
- [x] Introduce prompt settings drawer with default system prompt (generalized) and user override + reset. _(Modal supports conversion/optimization/adjustment prompts + reset/save.)_
- [x] Extract intake and diff/adjustment panels into components for easier iteration. _(Intake + workspace actions now componentized; preview rendering next.)_
- [ ] Display resume preview using sanitized content with clear section headers and download button.
- [ ] Surface concise summary-of-changes (bullet list) above expandable detailed diff.
- [ ] Add “Download optimized JSON” call-to-action adjacent to the diff summary for quick export.
- [x] Add “Clear workspace” action wiping stored key, resumes, prompts. _(Button added beside API key controls.)_

## Phase 4 · AI Flow Integration
- [x] Update optimization endpoint to read Gemini key from request payload and default to Gemini 2.5 Pro (user free tier).
- [x] Switch adjustment endpoint to Gemini 2.5 Flash with same key handling.
- [x] Standardize all AI calls on Gemini Flash latest (conversion, optimization, adjustment) so we always pull the newest fast model.
- [ ] Ensure text conversion, optimization, and adjustment share common error handling (quota, invalid key, malformed JSON) with aligned copy and retry guidance.
- [x] Abstract prompt strings into reusable builders with placeholders for user context. _(See `lib/prompts.ts`; optimization, adjustment, and conversion now reuse helpers.)_
- [ ] Preserve revert-to-original behavior by snapshots stored prior to each AI action.

- [x] Revise `README.md` with public onboarding instructions, feature overview, and self-host notes. _(First pass focuses on Gemini setup; iterate as new features land.)_
- [x] Add new `docs/gemini-key-setup.md` with step-by-step console walkthrough (include screenshots later).
- [x] Document storage behavior (local only, how to clear) and privacy posture. _(See `docs/storage-and-privacy.md` + README note.)_
- [ ] Outline founder-mode capabilities/future roadmap to set expectations.
- [ ] Prepare changelog or launch notes capturing new flows.
- [ ] Draft launch-day copy that reiterates “free, your key, stays local” messaging for landing page and onboarding surfaces.
- [x] Refresh Gemini key CTA/link copy to say “Get your free Gemini API key,” explain local storage + zero monitoring, and surface link to Google AI Studio before input. _(Key setup panel + helper flow updated.)_

### Intake Follow-ups
- Validate the new decision screen copy (JSON vs. help me) with pilot users; adjust wording/order if drop-off persists.
- Introduce progressive disclosure on JSON/Text tabs (collapsible "How this works" guidance + inline validation summary) so experienced users can move faster.
- Introduced progressive disclosure on JSON intake: helper moved into collapsible panel + inline paste focus for rapid load.
- Rebuilt the intake hero into two cards (Have JSON / Need JSON) with concise copy, inline validation chips, an always-visible paste/upload flow, and a Gemini key banner to guide conversions.
- Added a lightweight BuiltIt logo + favicon (`public/logo.svg`, `public/favicon.svg`) and updated site metadata to reference it.
- Normalized incoming resumes so legacy custom sections load cleanly; smoke reports removed from the repo for a clean handoff.
- Explore condensing the decision screen into a reversible intake toggle to reduce hesitation and keep the flow feeling lightweight.
- Reinforce the one-resume-at-a-time constraint in success states/download dialog so expectations stay clear.

### Workspace Follow-ups
- Neutral sample resume replaces personal data (Jensen Huang demo); prompt copy polish still open.
- Add a compact status strip in the workspace showing key + resume state, missing actions, and co-located "Apply all changes" / download CTA for the diff summary.
- Polish diff summary layout once data validations are finalized and ensure summary copy matches shared error messaging.
- Componentization status:
  1. ✅ `components/ResumePreview.tsx` now owns the sanitized resume layout.
  2. ✅ `components/ResumeDiffTable.tsx` + `ResumeDiffSummary.tsx` power the diff UI; summary copy still needs launch-ready language + download CTA hook.
  3. 🔜 Keep prop surface minimal while tightening prompt copy/tooltips and styling the summary for launch polish.
- Simplified workspace header by removing the legacy sample selector so primary actions stay the focus.

## Phase 6 · Testing & Validation
- [x] Restore lint baseline (upgrade `eslint-config-next`, remove implicit `any` usage, tighten storage/diff typing).
- [x] Confirm `npm run build` passes locally after schema typing adjustments in `lib/resume-types.ts`.
- [x] Add unit tests for `validateResumeJSON` and the local storage helper (`tests/unit` via `tsx --test`).
- [ ] Add targeted unit coverage for prompt builders.
- [ ] Smoke-test flows manually: key management, JSON intake, text conversion, optimization, adjustment, diff summary, clear workspace.
- [x] Ensure Playwright smoke flow covers JSON intake → workspace happy path (full regression moved to manual QA).
  - Command: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 npx playwright test tests/e2e/smoke-flow.spec.ts --project=chromium --workers=1`
- [ ] Capture edge cases (empty sections, malformed HTML) and document fixes/workarounds.
- [ ] Conduct pilot feedback sessions (at least one ordinary user, one founder) and log findings/decisions in this file.
- [ ] Collect social proof (quotes/metrics) from pilot testers for launch marketing.

## Phase 7 · Founder Enhancements (Optional Pre-Launch)
- [ ] Implement “Founder mode” toggle unlocking advanced prompt presets and future multi-model support.
- [ ] Scaffold model selector UI (default Gemini Pro/Flash, placeholders for other providers).
- [ ] Add analytics hooks (privacy-compliant) to measure usage; toggleable for self-hosters.

---

## Open Questions & Notes
- **Deterministic Parsing:** Decide whether to attempt regex/structured parsing before invoking Gemini, or rely solely on the user’s free-tier key.
- **Legal Copy:** Confirm whether additional privacy/terms statements are required once keys and resumes are stored locally.
- **Quotas:** Monitor free-tier limits post-launch to ensure guided usage stays within bounds; adjust copy if frequent throttling occurs.
- **Accessibility:** Audit new onboarding wizard and workspace updates for accessibility compliance (keyboard navigation, screen-reader support).
- **JSON Upload UX:** Define acceptable file size/type limits and error states for drag-and-drop uploads; document fallback behavior when parsing fails.

Keep this plan updated as tasks shift or new considerations appear. The checkboxes should reflect the current truth of the project.***
