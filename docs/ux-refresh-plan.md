# UX Improvement Plan

This document captures the UX decisions we just aligned on and breaks them into actionable steps so we can modernize the landing flow, demo mode, intake screen, and workspace without losing sight of the “simple, fast, free” positioning.

## Flow Goals
- **Lead with value:** “Tailor your resume to any job description in 30 seconds” remains the hero promise everywhere.
- **Invest before key:** Users must paste/upload their resume before we ever block on a Gemini key request.
- **Gradual disclosure:** Landing → intake → job description → Gemini key → optimization, each step introducing only what’s required.
- **Local + free reassurance:** Repeat “runs locally with your free Gemini API key, no payment required” in short supportive copy at key touchpoints.

## Landing Page Enhancements
1. **CTA simplification**
   - Primary button: “Upload your resume”.
   - Secondary ghost button: “Watch demo”.
   - Inline text link: “Need a Gemini API key? Here’s how.” (links to `docs/gemini-key-setup.md` in a new tab).
2. **3-step visual**
   - Replace current benefit list with a horizontal trio: `Upload resume → Add job description → Download tailored PDF`. (Rename “Describe job” copy to “Add job description” per latest direction.)
3. **Copy tightening**
   - Hero description: “Paste your current resume, add a job description, and watch Gemini tailor it locally. Bring your free Gemini API key—no accounts, no payments.”
4. **Layout tweaks**
   - Keep gradient hero but reduce dense paragraphs; include privacy reassurance badge (“Runs locally • Free Gemini key • No signup”).

## Demo Mode Enhancements
1. **Non-interactive framing**
   - Replace amber alert with a subtle bordered banner: “Live demo · This workspace is read-only. See how it works, then try your resume.”
   - Disable editors/buttons in demo mode if any remain interactive; ensure everything is clearly view-only.
2. **Primary CTA**
   - Single button: “Try your resume” → calls `handleStartYourOwn()` (scroll to intake).
   - Adjacent link: “Gemini key guide” → opens docs.
3. **Floating pill**
   - Sticky bottom-right pill after scrolling that repeats the CTA + guide link (“Ready? Try your resume · Need a key?”).
4. **Section labels**
   - Add concise headings above summary chips, job details, change log, and preview (“1. Job target”, “2. Improvements”, “3. Preview”) so the flow reads at a glance.

## Resume Intake & JSON Cleanup
1. **Textarea focus**
   - Keep the current large textarea and sample loader copy; reiterate “Your resume stays in this browser” below it.
2. **Advanced JSON accordion**
   - Remove the empty blue box/placeholder once collapsed. The informative blue box should appear only when the accordion is open.
   - Add microcopy clarifying that JSON import is optional for power users.
3. **Post-paste progress**
   - After a valid paste, show a success card (“Nice! Now add a job description and connect your Gemini key when prompted.”) to reward investment.

## Gemini Key Guidance
1. **Modal copy update**
   - Headline: “Grab your free Gemini API key.”
   - Subtext: “Needed once to run tailoring locally. Takes ~2 minutes.”
2. **Inline link**
   - Wherever we mention the key (landing hero, demo banner, sticky pill), point to the same guide so messaging is consistent.

## Optimization Workspace Tweaks
1. **Top-of-screen guidance**
   - For user mode, add a short sentence under the main heading: “Paste another job description or fine-tune manually any time.”
2. **Consistent terminology**
   - Rename buttons/labels from “Describe job” to “Add job description” for consistency with landing copy.
3. **Value reminders**
   - Add a tiny badge near export buttons: “Runs locally • Save as PDF or JSON”.

## Implementation Steps
1. ✅ Update landing hero component with new copy + CTA labels + 3-step visual plus inline video placeholder.
2. ✅ Inject new demo banner, disable interactive controls in demo mode, and surface a persistent CTA.
3. ✅ Clean up `ResumeIntake` advanced section so no placeholder box shows when collapsed, and add the post-paste success messaging.
4. Refresh Gemini key modal copy and add consistent doc links at hero, demo, and sticky CTA.
5. Adjust optimization workspace headings/buttons to the new terminology and copy.

Once these are in, we can reassess for any additional polish (e.g., add a quick video placeholder or analytics hooks) before moving to the next phase.

> Update – 2025-06-13: Demo experience now uses a simplified banner, top-right floating “Try your resume” CTA, and expanded resume preview toggle to reinforce the value before asking users to paste their own content.
> Update – 2025-06-13: Demo banner is now sticky across the screen with the “Try your resume” CTA, replacing the previous side card and bottom pill.
