---
tags:
- functional
- requirements
- features
title: Functional Requirements
---

# 1. Authentication and onboarding

-   User can sign in using the chosen application authentication
    provider.
-   User can connect a Google account through OAuth.
-   User sees exactly what data scopes are requested.
-   Backend validates OAuth `state` and callback.
-   Backend stores refresh credentials securely.
-   User can disconnect the Google integration.
-   Expired/revoked credentials produce a recoverable reconnect state.

# 2. Gmail

MVP permissions: `gmail.readonly`.

-   List messages using Gmail search query and pagination.
-   Fetch a selected message/thread.
-   Display sender, recipient where appropriate, subject, timestamp and
    readable body.
-   Handle multipart MIME content safely.
-   Summarize selected messages or a limited recent set.
-   Extract candidate tasks, dates, people and requested actions.
-   Provide source message ID and Gmail URL/reference when available.
-   Do not send, compose, modify, label, archive, trash, or mark
    messages read.
-   Do not persist full email bodies by default.

# 3. Google Calendar

MVP permissions: `calendar.readonly`.

-   List accessible calendars as needed.
-   Fetch events for a requested date range.
-   Handle all-day events, recurring instances, cancellations and
    timezone offsets.
-   Display event title, start/end, calendar and location if available.
-   Calculate free intervals from events and user working hours.
-   Distinguish actual calendar events from proposed focus blocks.
-   Do not create, edit, delete, RSVP, or move Google events.

# 4. Live clock and time handling

-   Display current local time and date.
-   Use user's configured IANA timezone, e.g. `Asia/Kolkata`.
-   Update display at least once per second or minute as appropriate.
-   Keep server-side date/time calculations timezone-aware.
-   Store event timestamps as instants; store user timezone separately.
-   Handle daylight-saving transitions for users outside India.
-   Never infer a deadline's timezone without a documented rule.

# 5. Notes

-   Create, read, update and delete personal notes.
-   Autosave with debounce and explicit save/error status.
-   Search note title and content.
-   Support basic Markdown: headings, paragraphs, bold, italic, links,
    lists and checklists.
-   Pin notes and assign tags.
-   Show last edited time.
-   AI can summarize or transform selected content.
-   AI can extract candidate tasks, but user reviews before saving.
-   Support links from notes to tasks and external source references.

# 6. Tasks

-   Create, read, update and delete workspace tasks.
-   Fields: title, description, status, priority, due date, estimated
    duration, source reference.
-   Support status values: `todo`, `in_progress`, `done`.
-   Support priority values: `low`, `medium`, `high`.
-   Allow user override of predicted priority.
-   Record completion events for later evaluation.
-   AI-created tasks must be reviewed before persistence.
-   Tasks are workspace data, not Google Tasks, unless that integration
    is separately approved.

# 7. Daily planner and reminders

-   Gather tasks, calendar events, working hours and current time.
-   Rank tasks using the ML model and deterministic rules.
-   Calculate free time without overlapping fixed events.
-   Respect task duration estimates, deadlines, breaks and user
    availability.
-   Flag impossible or overloaded plans.
-   Explain why a task was prioritized.
-   Save a proposed plan in the workspace.
-   Reminders in the MVP may be in-app or locally scheduled; do not
    promise reliable push notifications until implemented and tested.

# 8. AI assistant

-   Support current-module context and explicit global context.
-   Use backend tools with strict authorization.
-   Return structured outputs for tasks and schedule proposals.
-   Cite source email/message or calendar event for extracted facts.
-   Say when data is unavailable or ambiguous.
-   Ask for confirmation before creating/updating workspace data from
    suggestions.
-   Cannot call Google write APIs in the MVP.
-   Do not use the model as the sole source of truth for time
    arithmetic, permissions, or scheduling constraints.

# 9. Document upload and summarization

This capability is part of the original college plan. For a seven-day
MVP, it may be limited or deferred. - Accept explicitly supported file
types and enforce size limits. - Validate MIME type and file content. -
Store files in Firebase Storage or the selected object store. - Extract
text server-side. - Summarize with source/page references where
possible. - Handle scanned PDFs as unsupported unless OCR is added. -
Keep uploaded documents private to the owner.
