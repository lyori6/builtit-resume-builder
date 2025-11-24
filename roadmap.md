# Product Roadmap & Improvement Plan

**Status**: Active / Living Document
**Last Updated**: 2025-11-19

This document outlines the strategic roadmap for the Resume Optimizer. It is a living document intended to be updated as features are planned, implemented, and verified.

---

## 1. 🏗️ Architecture & Code Quality (Critical)
**Goal**: Reduce technical debt and improve maintainability of the core application logic.

### Problem
`app/page.tsx` has grown to over 1,700 lines. It currently handles:
-   Global state management
-   API interaction (Gemini)
-   UI rendering (Landing, Intake, Results)
-   File parsing (JSON/Text)
-   Local storage synchronization

### Plan
1.  **Extract Logic to Hooks**:
    -   `useResumeOptimizer`: Manage the core optimization lifecycle (text -> json -> optimized).
    -   `useResumeIO`: Handle file imports, exports, and parsing logic.
2.  **Component Decomposition**:
    -   Break `page.tsx` into distinct view components:
        -   `<IntakeView />`: The initial landing and input state.
        -   `<ResultsView />`: The post-optimization dashboard.
        -   `<EmptyState />`: Helper for zero-state rendering.
3.  **Type Safety**:
    -   Strictly type the `ResumeData` interfaces and ensure consistent usage across the new hooks.

---

## 2. 🎨 Feature: Resume Themes
**Goal**: Allow users to personalize the look and feel of their resume to match their industry or personality.

### Problem
Currently, `ResumePreview.tsx` supports only one hardcoded layout. Users have no control over fonts, spacing, or accent colors (beyond the global app color).

### Plan
1.  **Theme Registry**:
    -   Create a `themes.ts` definition file.
    -   Define themes with properties: `fontFamily`, `spacing`, `layout` (e.g., 'sidebar' vs 'single-column'), `accentColor`.
2.  **Theme Context**:
    -   Add a `selectedTheme` state to the optimizer context.
3.  **UI Switcher**:
    -   Add a "Theme" dropdown or carousel in the "Fine-tune manually" or top bar area.
4.  **Implementation**:
    -   **Modern (Default)**: The current clean look.
    -   **Classic**: Serif fonts (Times New Roman/Merriweather), centered headers, traditional spacing.
    -   **Minimal**: Monospace/San-serif, no icons, black & white only.

---

## 3. 💾 Feature: Session History ("My Resumes")
**Goal**: Enable users to manage multiple versions of their resume for different job applications.

### Problem
The app is currently "ephemeral". If a user optimizes for "Job A", then restarts for "Job B", the work for "Job A" is overwritten in the local storage buffer.

### Plan
1.  **Storage Schema Update**:
    -   Migrate `localStorage` from storing a single `resumeData` to a `resumeHistory` array.
    -   Each entry needs: `id`, `timestamp`, `jobTitle` (derived from JD), `companyName`, and the `resumeJSON`.
2.  **Sidebar / Drawer UI**:
    -   Add a "History" or "Saved Resumes" button.
    -   Opens a drawer listing past optimizations.
3.  **Actions**:
    -   **Load**: Restore a previous state.
    -   **Delete**: Remove from history.
    -   **Rename**: Label the version (e.g., "Google Application").

---

## 4. 🖨️ UX: Print & PDF Perfection
**Goal**: Ensure the "Download PDF" output is professional and glitch-free.

### Problem
We rely on the browser's native `window.print()`. This often leads to:
-   Awkward page breaks (cutting text or sections in half).
-   Loss of background colors (depending on user browser settings).
-   Incorrect margins.

### Plan
1.  **Print-Specific CSS**:
    -   Use `@media print` to strictly define margins and hide non-resume UI (already partially done, needs audit).
2.  **Page Break Control**:
    -   Apply `break-inside: avoid` to key resume sections (Experience items, Skills grid).
    -   Ensure headers never detach from their content.
3.  **Preview Mode**:
    -   Add a "Print Preview" modal that renders the resume in an iframe with print styles applied, so the user sees exactly what will print before opening the system dialog.

---

## 5. ✍️ Feature: Cover Letter Generator
**Goal**: Generate a tailored cover letter based on the user's resume and the job description.

### Problem
Users often struggle to write cover letters that effectively highlight their relevant experience for a specific job.

### Plan
1.  **UI Integration**:
    -   Add a "Generate Cover Letter" button in the `ResultsView` or `JobSetupView`.
2.  **API Integration**:
    -   Use Gemini to generate the cover letter content.
    -   Prompt should include: Resume data, Job Description, and Tone preferences.
3.  **Output**:
    -   Display the generated cover letter in a modal or new view.
    -   Allow editing and downloading (PDF/DOCX).

---

## Prioritization

| Priority | Initiative | Effort | Impact |
| :--- | :--- | :--- | :--- |
| **P0** | **Refactor `page.tsx`** | High | High (Maintenance) | **Done** |
| **P1** | **Print Perfection** | Low | High (Core Value) | **Done** |
| **P2** | **Session History** | Medium | Medium (Retention) | **Done** |
| **P3** | **Cover Letter Generator** | High | High (Value) | **Next** |
| **P4** | **Resume Themes** | Medium | Medium (Delighter) | **Backlog** |

## Completed Improvements
- **API Reliability**: Updated all Gemini API integrations to use `gemini-2.5-flash` (validation/adjustments) and `gemini-2.5-pro` (optimization), resolving authentication and model availability issues.
- **Architecture**: Successfully decomposed `page.tsx` into `IntakeView`, `JobSetupView`, and `ResultsView`, with logic extracted to `useResumeOptimizer` and `useResumeIO`.
- **Print**: Simplified printing by reverting to native browser dialog with optimized CSS.
