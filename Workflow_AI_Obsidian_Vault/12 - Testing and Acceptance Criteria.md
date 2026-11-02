---
tags:
- testing
- qa
- acceptance
title: Testing and Acceptance Criteria
---

# 1. Critical end-to-end acceptance tests

## Authentication and OAuth

-   [ ] Unauthenticated user cannot access private modules.
-   [ ] OAuth callback rejects invalid/missing state.
-   [ ] User can connect a Google test account.
-   [ ] Refresh token never appears in browser storage or frontend
    responses.
-   [ ] Revoked credentials show reconnect state.
-   [ ] Disconnect removes stored credentials and invalidates the
    connection.

## Gmail

-   [ ] User can search/list messages.
-   [ ] User can open a selected message.
-   [ ] MIME/plain-text and HTML messages are handled safely.
-   [ ] Summary refers to correct message.
-   [ ] Extracted date/action includes source reference and
    confidence/uncertainty.
-   [ ] No send/modify/archive/delete endpoint or UI action exists.

## Calendar and clock

-   [ ] Events display in configured timezone.
-   [ ] All-day events render correctly.
-   [ ] Recurring event instances are not duplicated.
-   [ ] Free-time calculation does not overlap fixed events.
-   [ ] Live clock matches the configured timezone.
-   [ ] No create/update/delete event operation exists.

## Notes and tasks

-   [ ] Note create/edit/delete works.
-   [ ] Autosave status is accurate.
-   [ ] Search returns matching notes.
-   [ ] User cannot access another user's notes/tasks.
-   [ ] AI-generated task proposal is not persisted until user confirms.
-   [ ] Manual priority override remains visible and is not silently
    overwritten.

## AI and planner

-   [ ] AI can answer using active note context.
-   [ ] AI can answer a cross-module question when the user requests
    global context.
-   [ ] Email/document prompt injection does not override system
    permissions.
-   [ ] Unknown facts are reported as unknown.
-   [ ] Sources are attached to externally derived claims.
-   [ ] Proposed blocks never overlap calendar busy intervals.
-   [ ] Overloaded days produce a warning rather than a fake feasible
    plan.
-   [ ] ML failure falls back to documented baseline logic.

## UI and accessibility

-   [ ] Sidebar and AI panel work at supported widths.
-   [ ] Keyboard focus is visible.
-   [ ] Primary workflows can be completed without a mouse.
-   [ ] Loading, empty, error and success states exist.
-   [ ] No major layout shift during data loading.
-   [ ] Reduced-motion preference is respected.

# 2. Test layers

-   Unit: date/time utilities, free/busy calculation, task ranking,
    validation.
-   Integration: API routes, Firestore, Google API adapters, token
    refresh.
-   Security: authorization, ownership, OAuth state, rules, token
    leakage, prompt injection.
-   UI: component and workflow tests.
-   ML: dataset validation, baseline comparison, holdout evaluation.
-   User testing: task completion, confusion points, perceived focus and
    visual clarity.

# 3. Demo acceptance script

1.  Sign in.
2.  Connect a Google test account.
3.  Show Gmail inbox and open a message.
4.  Summarize it and extract a candidate task.
5.  Save the reviewed task into Workflow AI.
6.  Open a note and ask AI to create a preparation outline.
7.  Show today's Google Calendar events and live clock.
8.  Ask AI to plan remaining work around calendar commitments.
9.  Show proposed schedule and source references.
10. Demonstrate that Google Calendar and Gmail remain unchanged.
