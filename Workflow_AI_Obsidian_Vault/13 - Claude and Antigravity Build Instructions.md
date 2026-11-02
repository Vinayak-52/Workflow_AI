---
tags:
- claude
- antigravity
- agent-instructions
title: Claude and Antigravity Build Instructions
---

# Purpose

Use this vault as the shared product and engineering specification.
Claude and Antigravity should read the project documents before
proposing architecture or editing code.

## 1. Mandatory context

Before implementation: 1. Read `00 - Start Here.md`. 2. Read Product
Requirements, Original College Plan Mapping, UX and Visual Design
System, Technical Architecture, Security and Privacy, and the relevant
feature specification. 3. Inspect the existing repository before
changing it. 4. Identify existing framework, package manager, routes,
components, database setup and environment variables. 5. Report
conflicts between the current code and this specification before making
broad changes.

## 2. Implementation rules

-   Do not replace the whole application when a targeted change is
    sufficient.
-   Do not invent API credentials or hardcode secrets.
-   Do not put secrets in frontend code.
-   Do not add Google write scopes or write operations.
-   Do not claim integrations work until tested against a real OAuth
    test account.
-   Do not use mock data in a live connected view unless it is clearly
    labelled.
-   Do not silently change the agreed stack or database.
-   Do not delete existing features without explaining the impact.
-   Use reusable components and typed API contracts.
-   Validate all inputs on the backend.
-   Enforce user ownership on every private data operation.
-   Keep UI states complete: loading, empty, error, success,
    disconnected.
-   Make the interface responsive and keyboard accessible.
-   Preserve the distinction between ML predictions, LLM suggestions and
    deterministic rules.

## 3. UI implementation quality bar

The UI must look like a cohesive premium desktop product: - Consistent
design tokens. - Clear hierarchy and restrained color. - Strong
typography and spacing. - Consistent controls and component states. -
Thoughtful empty/loading/error states. - No arbitrary gradients,
excessive glass effects or decorative clutter. - Avoid oversized cards
that waste workspace. - Keep the central content area spacious. - Make
contextual AI accessible without taking over the screen. - Maintain
clear visual distinction between Google source data and AI proposals.

Before marking a screen complete, inspect it at desktop and narrow
viewport sizes and correct alignment, overflow, spacing, contrast and
interaction problems.

## 4. Safe execution workflow

For each feature: 1. State the files likely to change. 2. State the
acceptance criteria being addressed. 3. Implement the smallest coherent
slice. 4. Run lint/typecheck/tests/build. 5. Manually verify the
relevant user flow. 6. Report files changed, tests run, known
limitations and next step.

Do not claim tests passed if they were not run.

## 5. Suggested implementation prompts

### Initial repository audit

"Read the Workflow AI Obsidian vault, especially Start Here, Product
Requirements, Technical Architecture and Security. Inspect this
repository without modifying files. Report the current architecture,
missing pieces, conflicts with the specification, and a prioritized
implementation plan."

### Design system

"Implement the application shell and design system from the UX
specification. Focus on sidebar, top bar, responsive content layout,
contextual assistant panel, typography, spacing, colors, reusable
controls, skeletons, empty states and error states. Do not implement
fake integration data as if it were real."

### Notes module

"Implement the Notes module according to Functional Requirements and UX
specification. Include list/search, Markdown editing, autosave status,
tags, pinning, CRUD, loading/error/empty states and owner-scoped backend
persistence. Add tests."

### Google integration

"Implement server-side Google OAuth with only Gmail readonly and
Calendar readonly scopes. Follow Security and API specifications. Do not
add send, compose, modify, event create, event update or event delete
operations. Ensure tokens remain server-side."

### Contextual assistant

"Implement the contextual assistant using only backend tools defined by
the AI and ML specification. Treat email and document text as untrusted
input. Add source references, structured proposals, ownership checks and
explicit confirmation before workspace mutations."

### Daily planner

"Implement deterministic free-time and scheduling logic. Use actual
calendar busy intervals, timezone-aware dates, task durations, working
hours and breaks. Use Random Forest priority output if available,
otherwise documented baseline rules. Do not create or modify Google
Calendar events."

### QA review

"Compare the implementation against all acceptance criteria. Run tests,
lint, typecheck and production build. Inspect key screens at desktop and
mobile widths. Report each criterion as pass/fail/not tested and do not
mark unverified features complete."

## 6. Definition of done for an AI coding agent

A task is complete only when: - Requirements are met. - Code is
integrated with existing architecture. - Types and validation are
present. - Relevant tests pass. - UI states are implemented. - Security
and permissions are respected. - Limitations are documented.
