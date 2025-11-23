# Resume Optimizer Public Launch Plan (Rebuild)

Tech lead plan for rebuilding the resume optimizer experience end-to-end in alignment with the new specification. Keep this document source-of-truth by checking off tasks as they ship, tagging ownership, and logging decisions inline.

## How to Use This Plan
- Update the checkboxes directly in this file; add `(owner, ETA)` next to each task once staffed.
- Add short decision logs (`> Decision – YYYY-MM-DD:`) below the affected subsection so context travels with the work.
- Surface new blockers or scope changes by inserting a ⚠️ bullet in the relevant phase rather than creating a new document.

## Core Objectives & Success Metrics
- Deliver a privacy-first, browser-only Gemini-powered resume optimizer that produces a downloadable PDF in < 60 seconds from landing.
- Achieve a ≥70% completion rate from landing page to PDF download during the public launch window.
- Preserve user trust: no server-side storage, clear messaging about local-only processing, and API key masking throughout the UI.
- Ship a polished landing page experience with a 30-second demo video and high-converting CTA.

### Target KPIs to Monitor Post-Launch
- Landing ➜ Resume input conversion.
- Resume input ➜ API key saved conversion.
- API key saved ➜ Optimization success conversion.
- Average time from landing to download.
- Error rate segmented by API failures vs. user validation issues.

## Guiding Principles & Constraints
- **Privacy by default:** All processing in-browser, localStorage only; never log or transmit keys or resume content.
- **Speed to value:** 4 clicks from landing to download, perceived wait time < 20 seconds.
- **Desktop-first polish:** Responsive enough for tablets, but primary breakpoint ≥1024px.
- **Clarity of copy:** Reinforce “runs locally / free / bring your own key” at every critical step.
- **Design fidelity:** Honor the provided design system (colors, typography, spacing, button variants) and interaction spec.
- **Extensibility:** Architect components to support advanced features (JSON import, fine-tuning) without rework.

## Current State Snapshot (2025-10-21)
- Working toward a ground-up rebuild; treat existing code as reference only—no legacy assumptions.
- No analytics configured; Lyor will handle Google Analytics + Microsoft Clarity setup closer to launch.
- Demo and tutorial videos not yet produced; queued for Lyor after core experience is stable.
- Gemini API usage relies on user-provided keys via localStorage; no backend endpoints planned.

## Ownership & Collaboration
- **Lyor:** Analytics tooling, video production, help-center content, high-level launch comms.
- **Codex/Eng:** Application architecture, UI implementation, Gemini integration, PDF/JSON exports, testing, documentation.
- **Shared:** UX copy review, launch checklist validation, manual QA passes.

## Workstreams Overview
1. **Experience Architecture:** Routing, state management, component library, design token integration.
2. **Core Screens:** Landing, resume intake, API key modal, job description input, results workspace.
3. **AI Integration:** Gemini API client, prompt design, error handling, localStorage orchestration.
4. **Output & Utilities:** PDF generation, JSON export, diff presentation, manual fine-tune tooling.
5. **Quality & Compliance:** Accessibility, performance, cross-browser QA, privacy messaging, documentation.
6. **Launch Readiness:** Video assets, analytics instrumentation plan, marketing copy, support resources.

## Architecture & Flow Blueprint

### Application Shell
- Root component provides layout grid (header + main content) and mounts a `ResumeOptimizerProvider` context powered by `useReducer` to manage global state (resume, job, apiKey, uiStep, modals, toasts).
- Each screen (Landing, ResumeInput, ApiKeySetup, JobDescription, Results) lives in `src/screens/` and receives state/dispatch via context hooks—no prop drilling across unrelated components.
- Global UI primitives (`Modal`, `ToastHost`, `VideoModal`, `Spinner`, `PrimaryButton`, etc.) imported from `src/components/primitives/`.
- Toasts and dialogs rendered once at root; feature modules dispatch events (e.g., `dispatch({ type: 'SHOW_TOAST', payload })`).

### Component Hierarchy (Desktop-first)
```
AppShell
 ├─ Header
 ├─ ToastHost
 ├─ ModalHost
 └─ ScreenContainer (switches on uiStep)
     ├─ LandingScreen
     │   └─ DemoVideoCard (opens VideoModal)
     ├─ ResumeInputScreen
     │   ├─ ResumeTextarea
     │   └─ AdvancedJsonAccordion (Phase 3)
     ├─ ApiKeyModal (overlay triggered from ResumeInputScreen)
     ├─ JobDescriptionScreen
     └─ ResultsScreen
         ├─ ResultsSummary
         ├─ ActionToolbar (Download/Export/TryAnother)
         ├─ BeforeAfterToggle (Phase 3)
         └─ ManualFineTunePanel (Phase 4)
```

### State Management Strategy
- `uiStep` enum drives which screen is active (`landing`, `resume`, `apiKey`, `job`, `results`).
- `resume` slice stores `{ originalText, optimizedText, optimizedJson }`; selectors derive word counts/diffs.
- `jobDescription` slice holds latest posting text and timestamps.
- `apiKey` slice tracks `value`, `status` (`idle`, `validating`, `saved`, `error`), and masked display string.
- `ui` slice coordinates modals (`isApiKeyModalOpen`, `activeVideoId`), loading flags, and toast queue.
- Persistence handled via `useEffect` hooks that sync slices to localStorage using debounced writes; schema migrations run on provider mount before initial state load.

### Navigation & Guards
- Landing CTA dispatches `SET_STEP('resume')`.
- `Continue` action checks resume validation; on success, opens API Key modal if key missing or stale.
- Saving key closes modal and advances to `job` step; back links dispatch `SET_STEP('resume')` without clearing data.
- Optimization success triggers storage updates and `SET_STEP('results')`; errors dispatch `SHOW_ERROR_MODAL`.

### Client-Side State Machine
- **States:** `landing`, `resume`, `apiKey`, `job`, `optimizing`, `results`, `error`.
- **Transitions:**
  - `landing -> resume` via CTA click.
  - `resume -> apiKey` when API key required; otherwise `resume -> job`.
  - `apiKey -> job` on successful key save; `apiKey -> resume` on cancel.
  - `job -> optimizing` when Optimize pressed with valid inputs.
  - `optimizing -> results` on success; `optimizing -> error` on network/API failure.
  - `error -> job` when retrying; `results -> job` when trying another posting; `results -> resume` when uploading new resume.
- **Actions & Side Effects:** each transition can trigger toasts, storage sync, or modal toggles; reducer delegates side effects to custom hooks (`useOptimization`, `useStorageSync`).

### Data Flow
- **Inputs:** Resume text/JSON, job description, API key.
- **Processing Pipeline:** user input stored in state ➜ validation helpers (`validation.ts`) enforce length/schema ➜ `useOptimization` assembles prompt ➜ `fetch` call to Gemini ➜ parse/validate JSON response ➜ update state/storage.
- **Persistence:** On state change, `useStorageSync` writes relevant slices to localStorage keys (debounced). On load, `hydrateStateFromStorage` migrates legacy schema and dispatches `HYDRATE_COMPLETE`.
- **Outputs:** Results screen reads from state to render optimized resume; `Download PDF` triggers `window.print()` using same DOM; `Export JSON` pulls `resume.optimized_json` and triggers file download.
- **Error Surfaces:** invalid inputs produce inline messages; API errors push to `ErrorModal` with context-specific CTA; storage failures log to console and show warning toast.

### Async Workflow Overview
1. User clicks `Optimize`: dispatch `OPTIMIZE_REQUEST` (`loading=true`).
2. Client-side fetch to Gemini with local api key; retries once on malformed JSON with stricter prompt.
3. Success: dispatch `OPTIMIZE_SUCCESS` with parsed payload; update storage and toast success; step -> results.
4. Failure: dispatch `OPTIMIZE_FAILURE`; show error modal with retry/update-key actions; keep step at `job`.

### Extensibility Hooks
- Modal host supports stacking (e.g., API Key modal > Video modal) using z-index tokens; context tracks stack order.
- Analytics dispatcher (Phase 5) listens to state transitions; instrumentation toggled via config flag.
- `FeatureFlags` object loaded from `/config/launch.json` to enable/disable advanced features without redeploy.

## Phase Plan & Task Breakdown

### Phase 0 – Discovery & Technical Blueprint (Week 0)
- [ ] Document architecture decisions: app shell, state management approach, routing strategy, storage abstraction.
- [ ] Validate Gemini API availability and rate limits using a sandbox key; confirm `generateContent` payload/response expectations.
- [ ] Draft prompt templates and JSON response schema; socialize with stakeholders for approval.
- [ ] Produce wireframes/flowchart of component hierarchy and cross-screen navigation (for dev + QA alignment).
- [ ] Define localStorage schema versioning and migration strategy (keys, resume data, metadata).
- [ ] Identify third-party dependencies (PDF generation, diff highlighting, JSON editor) and evaluate bundle impact.
- [ ] Create initial backlog in project tracker mapping to phases in this document.

> Discovery – 2025-10-21: The current Next.js implementation (`app/page.tsx`) centralizes all flow logic in a single component with state slices for intake, optimization, and diffing. For the rebuild we will split each screen into dedicated React components managed via a thin state machine/context so navigation stays client-only and easier to test.
> Discovery – 2025-10-21: Resume optimization currently funnels through `/api/optimize-resume` using the server-side Google SDK. New plan must call Gemini directly from the browser with the user-supplied key to satisfy the “runs locally” requirement—server route slated for removal during rebuild.
> Discovery – 2025-10-21: PDF export already relies on `window.print()` plus `@media print` rules in `app/globals.css`. We will reuse this behavior, auditing the print stylesheet after the workspace redesign to keep parity.
> Update – 2025-10-21: Introduced `OptimizerProvider` + storage sync hook to manage resume/input/API key state centrally; legacy page now wraps in provider while retaining existing behavior.
> Update – 2025-10-22: Gemini key validation now dispatches through the shared context, keeping key status, errors, and persistence in sync with the global reducer.
> Update – 2025-10-22: Optimization runs, error states, and diff visibility now live in the provider; `WorkspaceActions` reads context-driven status, and API responses dispatch `OPTIMIZE_*` actions with captured diff metadata.
> Update – 2025-10-22: API responses now surface Gemini change metadata (counts, keyword matches) and the client persists it through the context/localStorage pipeline for future results summaries.
> Update – 2025-10-22: Added optimized resume selectors so preview/export pull from shared context, paving the way to drop local workspace state.
> Update – 2025-10-23: Job targeting screen now mounts `WorkspaceActions`, restoring the optional final adjustments prompt, revert-to-original control, and aligning pre-optimization metrics with the results summary design.
> Update – 2025-10-23: API key controls now conditionally render—saved keys hide the “Need an API key?” CTA and the clear action returns users to the intake step, keeping the optimization workspace focused.
> Update – 2025-10-23: Resume normalization now coerces non-object project/experience URLs into `{ href }` objects and synthesizes fallback project names/ids when Gemini omits them, keeping conversion validation happy.
> Update – 2025-10-23: `/api/convert-resume` now normalizes Gemini output before validation so messy inputs (e.g., PDF dumps) no longer trip server-side schema errors.
> Update – 2025-10-23: Auto-open the Quick Setup modal whenever an optimization is triggered without a saved key so users don’t hit a dead-end inline error.
> Next – 2025-10-23: Migrate optimization/adjust/convert flows to call Gemini directly from the browser with the stored key, leaving server routes as compatibility shims.
> Update – 2025-10-22: Workspace preview and exports now read from `SET_WORKSPACE_RESUME`; legacy local resume state removed in favor of reducer-backed data.
> Update – 2025-10-22: Reducer tracks resume origin (`none/custom/example`), replacing bespoke flags and keeping export filenames + future navigation in sync.
> Update – 2025-10-22: Added “Load sample resume” control wired to context-based example loading for fast demos.
> Update – 2025-10-22: Workspace summary now surfaces Gemini metadata (improvement counts, keyword matches) pulled from the reducer.
> Next – 2025-10-22: Schedule manual smoke run (sample load → optimize → export) once summary styling is approved.

## ✅ Finalized Implementation Decisions

**Landing Page**
- Headline locked to “Tailor Your Resume to Any Job in 30 Seconds”.
- Benefit bullets (centered):
  - ✓ Runs locally – your data stays on your device
  - ✓ Powered by Google’s free Gemini AI
  - ✓ No subscription needed
- Hero video uses a static 640×360 thumbnail with gradient background, large play icon, top “Watch Demo” and bottom “30 seconds” text, 12px radius, and 0 4px 6px rgba(0,0,0,0.1) shadow.
- Clicking the thumbnail opens a modal embedding `https://www.youtube.com/embed/dQw4w9WgXcQ` (placeholder, replace before launch); modal reuses global modal styling.

**Sample Resume CTA**
- Exposed only on Screen 2 (Resume Input) above the textarea.
- Copy: “Want to try it first?” centered (14px, #64748b) with a single secondary button “📋 Load Sample Resume” (outlined blue, 200px width, centered, 16px margin).
- Divider text: “────────── or ───────────” (14px, #94a3b8) centered beneath button.
- On click: textarea populates with the provided Jane Smith sample resume, Continue button enables, success message “✓ Sample resume loaded. Feel free to edit or continue as-is.” appears (green #10b981, 14px) and fades after 3 seconds. No auto-navigation.
- Sample resume text exactly as specified (Jane Smith, Senior Software Engineer, etc.).

**Advanced JSON Import**
- Collapsed link text: “⚙️ Advanced: Import JSON resume instead” (14px link style, underline on hover).
- Expanded panel includes:
  - Header “Import JSON Resume” (20px bold).
  - Info banner: text “ⓘ Use JSON Resume format for precise control over your resume structure.” on light blue background with left border.
  - JSON textarea (300px height, monospace) with validation buttons `[Validate JSON]` and `[Load Sample JSON]`.
  - “What is this?” link opening modal explaining JSON Resume schema.
  - “← Back to text input” link collapses the panel.
- Do not auto-open JSON panel after loading sample textarea.

**Gemini Help**
- Header shows key status plus help icon (`?`) which opens modal “Getting Your Free Gemini API Key” with step list and “Open AI Studio →” link.

**Results Summary**
- Use chips layout (inline-flex, gap 12px, center): each chip has counts in 24px bold #2563eb, labels 12px #64748b, background #f0f7ff, border 1px #bfdbfe, padding 12px 16px, radius 8px. Metrics shown: improvements, keywords, word count, processing time.
- “Show all changes” link toggles expanded panel:
  - Container: padding 24px, background #f8fafc, border 1px #e2e8f0, radius 8px, max height 400px with smooth transition.
  - Sections grouped by change type (✏️ modified, ➕ added, etc.), each showing up to 3 bullet items with “[X more…]” expander.
  - Keywords matched rendered as inline chips (background #dbeafe, text #1e40af, padding 4px 8px).
- Store metadata structure with fields: timestamp, processing_time_seconds, improvements_count, word_count, keywords_matched array, and changes array with detailed entries (type, section, before/after, reason). Persist to localStorage after each optimization.

### Phase 1 – Project Skeleton & Design Tokens (Week 1)
- [ ] Scaffold project structure (`src/components`, `src/screens`, `src/utils`, `src/styles`) per spec.
- [ ] Implement global styles and CSS variables for colors, typography, spacing, and elevation.
- [ ] Build foundational UI primitives: `Button`, `Textarea`, `Modal`, `Spinner`, `Toast`, `StepIndicator`.
- [ ] Implement `Header` and layout container with responsive breakpoints.
- [ ] Set up routing/state management (SPA with screen states or router) including persistence hooks.
- [ ] Establish localStorage helper (`save`, `get`, `clear`, namespacing, error handling).
- [ ] Integrate linter, formatter, and baseline test harness (unit + smoke e2e placeholder).
- [ ] Add CI configuration for lint/test (or document manual checks if CI unavailable).

### Phase 2 – Core Flow MVP (Weeks 1-2)
#### Landing Page & Messaging
- [ ] Assemble landing layout with placeholder video poster and CTA interactions.
- [ ] Embed YouTube-hosted demo placeholder (static thumbnail + modal player) awaiting final asset from Lyor.
- [ ] Implement benefits list, advanced link, help modal placeholder.
- [ ] Wire CTA smooth-scroll / navigation to resume intake screen.
- [ ] Insert privacy messaging blocks per spec.
- [ ] Provide hooks/placeholders for final video asset (Owner: Lyor to replace later).

#### Resume Intake (Screen 2)
- [ ] Build resume textarea with validation (100–50,000 chars) and character count.
- [ ] Implement disabled/enabled states for `Continue` button with real-time validation feedback.
- [ ] Add Advanced JSON import accordion (UI shell only for now; functionality in Phase 3).
- [ ] Preserve resume content in localStorage on continue/back navigation.

#### API Key Modal (Screens 3 & 3b)
- [ ] Build modal with two-step flow: explanation + key input.
- [ ] Handle link-outs (Get Key, video help placeholder) without closing modal.
- [ ] Validate key format (`AIza`, length ~39) with inline errors.
- [ ] Store masked key in localStorage; surface success toast; update header status indicator.
- [ ] Ensure modal cannot be dismissed when key is required but absent.

#### Job Description Input (Screen 4)
- [ ] Implement textarea with validation (≥50 chars) and loading overlay interactions.
- [ ] Connect back navigation to resume screen while retaining data.
- [ ] Prepare call to `optimizeResume` (stub until API client ready).

#### Results Workspace (Screen 5 MVP Scope)
- [ ] Display success headline, stats placeholders, and action buttons.
- [ ] Render optimized resume text (single view) and basic metadata.
- [ ] Wire Download PDF button to existing print flow (`window.print`) and ensure print stylesheet parity with current app.
- [ ] Persist results/metadata to localStorage for session continuity.
- [ ] Implement error modal triggered from API failures with retry + update key actions.

#### Gemini Integration (MVP)
- [ ] Implement `optimizeResume(resume, jobDescription, apiKey)` client with fetch, timeouts, and structured error mapping.
- [ ] Parse JSON response, guard against malformed output (retry w/ corrected prompt if necessary).
- [ ] Capture metadata (improvements count, keywords) and store per schema.
- [ ] Mask API key in UI surfaces (header, settings).
- [ ] Log non-sensitive telemetry to console (for dev) with toggle to disable in production build.

### Phase 3 – Enhanced UX & Feedback (Week 3)
- [ ] Replace landing placeholder with final demo video (Owner: Lyor to supply asset & caption file).
- [ ] Implement toast notifications (success/info/error) for key user actions.
- [ ] Add loading overlay animations and microcopy for API call.
- [ ] Build Before/After toggle with diff highlighting (green add, yellow modify, red strike).
- [ ] Implement Show Detailed Changes accordion sourced from API response.
- [ ] Enable Copy Text button with clipboard API and success toast.
- [ ] Add Export JSON download flow with filename convention.
- [ ] Complete Try Another Job path retaining resume data and clearing job description.
- [ ] Improve error modals with actionable tips and API code-specific guidance.
- [ ] Integrate `StepIndicator` progress component (optional per design spec).

### Phase 4 – Advanced Features & Power Tools (Week 4)
- [ ] Complete JSON resume import: drag/drop, validation, inline errors, success state.
- [ ] Implement manual fine-tuning section with Visual + JSON tabs, real-time preview sync.
- [ ] Add Settings dropdown (change key, clear workspace, help/support).
- [ ] Build Clear Workspace confirmation modal and storage purge logic (respect optional keep-key toggle).
- [ ] Integrate Help modal contents (FAQ, video links, key instructions).
- [ ] Add keyboard shortcuts (optional stretch): e.g., `Cmd+Enter` to optimize.
- [ ] Ensure API key masking + update flow accessible via settings.

### Phase 5 – Polish, QA, and Launch Prep (Week 5)
- [ ] Conduct accessibility audit (focus states, landmarks, ARIA labels, keyboard navigation).
- [ ] Run performance profiling (bundle size checks, lazy loading video, code splitting where necessary).
- [ ] Execute cross-browser smoke tests (Chrome, Firefox, Safari, Edge) and document results.
- [ ] Validate localStorage quota handling and fallback messaging.
- [ ] Finalize copy review across all screens (privacy statements, errors, microcopy).
- [ ] Coordinate analytics instrumentation plan (Owner: Lyor) – outline events, ensure data layer hooks ready.
- [ ] Prepare launch-day checklist (manual QA script, rollback plan, support contact).
- [ ] Update README/docs with setup instructions, testing commands, architecture overview.
- [ ] Record final end-to-end walkthrough video/GIF for marketing use.

## Detailed Implementation Notes

### Prompt & Response Handling
- Standardize prompt template inclusive of instructions, resume, job description, and output schema.
- Implement guard rails: retry with lower temperature or explicit schema reminder on JSON parse failure.
- Store raw Gemini response (without personal data) only in memory for debugging; never persist to storage.
- Consider chunking or summarizing for resumes over token limit; confirm Gemini max tokens support.
- MVP request format (client-side `fetch`):
  ```ts
  await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKeyFromLocalStorage
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: buildOptimizationPrompt(resumeText, jobDescription)
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    })
  })
  ```
- Expected AI response payload (stringified JSON) will be parsed into:
  ```json
  {
    "optimized_resume": "string",
    "changes": [
      { "type": "modified", "section": "Experience", "description": "..." }
    ],
    "improvements_count": 12,
    "keywords_matched": ["keyword1", "keyword2"],
    "word_count": 2450
  }
  ```
- Embed a JSON schema validator to confirm mandatory fields exist before updating UI state; surface a descriptive error modal on mismatch.

### PDF Generation Strategy
- Reuse existing `window.print()` workflow leveraged in the current app to keep export behavior identical.
- Audit and adapt print-specific styles (`@media print` in `app/globals.css` + component overrides) so the optimized resume renders cleanly post-rebuild.
- Verify page sizing, margins, and typography match letter-sized output; adjust CSS variables as needed.
- Provide clear user guidance (toast or inline tip) reminding users to use Print to save as PDF if browser UI differs.

### Diff & Highlighting
- Implement lightweight diff utility (e.g., `diff-match-patch`) to power Before/After highlights.
- Map API-provided change list to UI icons (✏️, ➕, ➖, 🎯) per section.
- Provide fallback message if diff generation fails (“Showing optimized version only”).

### Landing Video Placeholder
- Build a reusable `VideoModal` that accepts a YouTube video ID, lazy-loads the iframe only on open, and starts muted with controls enabled.
- Landing page showcases a 640×360 card with static thumbnail and play button overlay; clicking opens the modal while focus traps and ESC close are supported.
- Default thumbnail sourced from `https://img.youtube.com/vi/<id>/hqdefault.jpg`; allow override when a custom poster asset is available.
- Expose configuration (env or JSON) so Lyor can swap the video ID without code changes at launch time.
- Provide fallback message for browsers blocking YouTube embeds, linking to the external watch page in a new tab.

### Storage Schema (localStorage Keys)
```
gemini_api_key           -> masked when displayed
resume.original_text     -> latest resume input
resume.optimized_text    -> most recent optimized resume (plain text for preview)
resume.optimized_json    -> structured JSON string returned by Gemini (for diff + exports)
resume.job_description   -> last job description used
resume.optimization_meta -> JSON string (changes, keywords, timestamp, word counts)
resume.schema_version    -> integer for future migrations
```
- Migration note: keep schema version in a dedicated key; during first load of rebuilt app, detect legacy `builtit:resume-builder` payloads and offer one-time import or reset prompt.

### Testing Matrix
- **Unit Tests:** validation utilities, storage helpers, Gemini response parser, diff generator.
- **Integration Tests:** full happy-path flow (resume ➜ job ➜ results), API error cases (mocked responses).
- **E2E Smoke:** simulate user journey via Playwright/Cypress focusing on primary browsers.
- **Manual QA Checklist:** align with specification testing requirements (landing, API key, results, downloads).

## Content, Video, and Analytics Deliverables
- [ ] Script & storyboard for 30s landing video (Owner: Lyor).
- [ ] Produce Gemini key tutorial video (Owner: Lyor) with captions and host location defined.
- [ ] Draft help-center articles: “Getting your Gemini API key”, “Advanced JSON import”, “Privacy promises”.
- [ ] Define analytics event naming schema and data layer interface (Owner: Lyor).
- [ ] Schedule analytics instrumentation for post-core-feature milestone (toggle-based injection to avoid privacy concerns).
- [ ] Create marketing launch copy (announcement post, email, changelog entry).

## Launch Checklist
- [ ] All Phase 1–5 tasks complete and validated.
- [ ] Videos embedded, autoplay disabled, captions verified.
- [ ] Accessibility audit signed off (WCAG 2.1 AA subset).
- [ ] Performance budgets met (<2s load, <200KB JS before Gemini SDK).
- [ ] Error monitoring strategy defined (console logging in dev, optional in-app debug panel behind flag).
- [ ] Support pathways ready (FAQ, contact link, troubleshooting steps).
- [ ] Final dry-run completed with fresh browser profile; confirm localStorage behavior.
- [ ] Backup documentation stored (`docs/` folder) including user manual & troubleshooting.

## Open Questions & Decisions Needed
- **Diff Visualization Depth:** Do we need inline highlights or section-level summaries only?
- **JSON Fine-Tune Scope:** Should manual edits immediately update stored data or require explicit save?
- **Analytics Timing:** When should analytics be embedded given privacy positioning? (Recommend opt-in post-launch.)
- **Localization:** Any near-term requirement for non-English copy?
- **Print Styling Ownership:** Identify responsible owner for maintaining the `@media print` styles as we evolve the results layout (especially when fine-tune mode introduces editable controls).

## Spec Clean-Up Notes
- “Try Another Job” behavior described twice in the source spec; treat the second occurrence as continuation of the same requirement.
- Confirm whether Settings dropdown lives on all screens or results screen only—the spec focuses on Screen 5.
- Video requirements duplicated between landing and assets sections; consolidate into single checklist during implementation.

---

Keep iterating on this document as new insights arrive. The plan should always reflect the latest understanding of scope, ownership, and sequencing leading up to the public launch.
