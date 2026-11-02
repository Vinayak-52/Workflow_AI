---
tags:
- roadmap
- mvp
- seven-days
title: Seven Day MVP Build Plan
---

# Objective

Deliver a credible vertical slice in seven days. This is a compressed
implementation sprint, not a replacement for the submitted eight-week
academic plan.

## Day 1 --- Foundation and visual shell

-   Confirm stack and repository.
-   Set up React/Vite/TypeScript and Express.
-   Configure Firebase project and environment variables.
-   Build app shell, sidebar, top bar and responsive layout.
-   Create design tokens and reusable UI primitives.
-   Add authentication shell and route protection.

**Exit criteria:** application runs locally; navigation and visual shell
are consistent.

## Day 2 --- Notes and tasks

-   Implement note CRUD and autosave.
-   Implement task CRUD and status/priority fields.
-   Add search, tags, pinned notes and task filters.
-   Add Firestore security rules.
-   Add loading, empty and error states.

**Exit criteria:** user can reliably create, edit, find and delete
notes/tasks.

## Day 3 --- Google OAuth and Gmail

-   Configure Google Cloud APIs and OAuth.
-   Implement server-side OAuth callback.
-   Store refresh credentials securely.
-   Implement Gmail list/search and message detail.
-   Add summary/action extraction endpoint with source references.

**Exit criteria:** test user can connect Google and read selected email
data without any write operation.

## Day 4 --- Calendar and clock

-   Implement calendar list and event range retrieval.
-   Normalize timezone-aware event data.
-   Build agenda/day view.
-   Add live clock.
-   Calculate free intervals and show next event.

**Exit criteria:** actual events and current local time display
correctly; no calendar writes are possible.

## Day 5 --- AI assistant

-   Implement assistant panel and context selection.
-   Add tools for reading emails, events, notes and tasks.
-   Add note summary and email summary.
-   Add source references and uncertainty handling.
-   Add proposal confirmation before saving workspace tasks.

**Exit criteria:** assistant answers grounded questions from connected
sources and cannot perform Google write actions.

## Day 6 --- Daily planner and ML integration

-   Implement deterministic free-time calculation.
-   Connect Random Forest inference if model is ready.
-   Add baseline fallback.
-   Generate daily plan and conflict warnings.
-   Save reviewed plans inside workspace.
-   Add responsive and accessibility improvements.

**Exit criteria:** plan uses real calendar busy intervals and workspace
tasks; proposed blocks are clearly labelled.

## Day 7 --- QA, polish and demo

-   Test main user journeys.
-   Test OAuth errors and revoked credentials.
-   Test data isolation and Firestore rules.
-   Test timezone and all-day event cases.
-   Fix visual inconsistencies and loading states.
-   Prepare seeded demo data only where clearly labelled.
-   Deploy and prepare demo script.

**Exit criteria:** all critical acceptance criteria in \[\[12 - Testing
and Acceptance Criteria\]\] pass.

## Cut line if behind schedule

Keep: app shell, notes, tasks, Google OAuth, Gmail read, Calendar read,
clock, basic assistant, daily agenda.

Defer: advanced rich text, document OCR, vector database, push
notifications, collaboration, complex animations, autonomous agents.
