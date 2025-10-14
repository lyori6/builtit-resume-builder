# Public Launch Implementation Plan

Tech-lead view of everything required to open the resume builder to the public while keeping the experience approachable for ordinary users. Track progress by ticking checkboxes as work lands; update notes inline when context changes.

## How To Use This Plan
- Update checkboxes directly in this file after each task is delivered.
- Add dates/owners in parentheses beside items once work is staffed.
- Document newly discovered issues or decisions beneath the relevant section so the plan stays authoritative.

---

## Phase 0 · Discovery & Alignment
- [ ] Confirm target personas (ordinary job seeker, founder/advanced) and primary success metrics for public launch.
- [ ] Collect sample plaintext resumes to benchmark conversion accuracy.
- [ ] Draft onboarding copy (Gemini key instructions, privacy notes, conversion tips).
- [ ] Finalize decision on deterministic parsing fallback vs. Gemini-only conversion.
- [ ] Identify legal/compliance requirements (privacy statement, terms update if any).

## Phase 1 · Key Management & Storage Foundation
- [x] Create `lib/local-storage.ts` helper with namespaced getters/setters, versioning, and clear-all utility.
- [ ] Implement onboarding wizard/modal component outlining Gemini free-tier usage, key handling, and deletion flow.
- [x] Build `app/api/check-key/route.ts` to validate user-supplied Gemini keys (no logging; handle quota/auth errors gracefully).
- [x] Wire client-side key entry UI to store keys in `localStorage`, surface success/error states, and expose delete/reset actions. _(Key setup card shipped; upgrade to multi-step wizard still pending.)_
- [x] Update documentation with detailed Gemini key instructions (`README.md`, `docs/gemini-key-setup.md`).

## Phase 2 · Resume Intake Experience
- [x] Upgrade `validateResumeJSON` to perform deep schema checks with descriptive errors. _(Covers basics, section metadata, and core item requirements.)_
- [x] Enhance JSON upload path: inline validation feedback, success state, “download current JSON” control. _(Added download action + helper copy.)_
- [x] Build text intake UI (textarea, guidance, loading/error states). _(Toggle between JSON/Text intake with validation messaging.)_
- [x] Implement `app/api/convert-resume/route.ts` using Gemini 2.5 Pro (via user key) to transform text → JSON; centralize prompt template in `lib/prompts.ts`.
- [x] Cache successful resumes in local storage, versioned per user, and expose quick download + switcher UI. _(Custom resumes persist across sessions; dropdown wiring for multiple locals TBD.)_
- [x] Provide sample JSON templates and links to “generate via your favorite AI” instructions. _(See `docs/resume-json-template.md` and onboarding copy.)_

## Phase 3 · Workspace & Prompt Controls
- [ ] Refactor `app/page.tsx` into logical child components (key setup, intake, workspace dashboard, diff summary, adjustment panel).
- [x] Introduce prompt settings drawer with default system prompt (generalized) and user override + reset. _(Modal supports conversion/optimization/adjustment prompts + reset/save.)_
- [ ] Display resume preview using sanitized content with clear section headers and download button.
- [ ] Surface concise summary-of-changes (bullet list) above expandable detailed diff.
- [x] Add “Clear workspace” action wiping stored key, resumes, prompts. _(Button added beside API key controls.)_

## Phase 4 · AI Flow Integration
- [x] Update optimization endpoint to read Gemini key from request payload and default to Gemini 2.5 Pro (user free tier).
- [x] Switch adjustment endpoint to Gemini 2.5 Flash with same key handling.
- [ ] Ensure text conversion, optimization, and adjustment share common error handling (quota, invalid key, malformed JSON).
- [x] Abstract prompt strings into reusable builders with placeholders for user context. _(See `lib/prompts.ts`; optimization, adjustment, and conversion now reuse helpers.)_
- [ ] Preserve revert-to-original behavior by snapshots stored prior to each AI action.

- [x] Revise `README.md` with public onboarding instructions, feature overview, and self-host notes. _(First pass focuses on Gemini setup; iterate as new features land.)_
- [x] Add new `docs/gemini-key-setup.md` with step-by-step console walkthrough (include screenshots later).
- [x] Document storage behavior (local only, how to clear) and privacy posture. _(See `docs/storage-and-privacy.md` + README note.)_
- [ ] Outline founder-mode capabilities/future roadmap to set expectations.
- [ ] Prepare changelog or launch notes capturing new flows.

### Intake Follow-ups
- Consider showing recently converted resumes in a dropdown history and add inline docs link to template file.

## Phase 6 · Testing & Validation
- [ ] Add unit tests for `validateResumeJSON`, local storage helper, and prompt builders.
- [ ] Smoke-test flows manually: key management, JSON intake, text conversion, optimization, adjustment, diff summary, clear workspace.
- [ ] Capture edge cases (empty sections, malformed HTML) and document fixes/workarounds.
- [ ] Conduct pilot feedback sessions (at least one ordinary user, one founder) and log findings/decisions in this file.

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

Keep this plan updated as tasks shift or new considerations appear. The checkboxes should reflect the current truth of the project.***
