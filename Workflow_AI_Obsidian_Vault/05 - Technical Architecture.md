---
tags:
- architecture
- backend
- frontend
title: Technical Architecture
---

# 1. Recommended architecture

Use a modular monolith for the academic prototype. Do not introduce
microservices in the first iteration.

``` text
React + TypeScript + Vite
        |
        | HTTPS / session
        v
Node.js + Express API
        |
        +-- Auth/session middleware
        +-- Gmail service ------ Gmail API (read-only)
        +-- Calendar service --- Google Calendar API (read-only)
        +-- Notes/task services
        +-- AI orchestration --- LLM provider
        +-- Planner service ---- deterministic scheduling
        +-- ML service -------- Python model API or batch inference
        |
        v
Firebase / Firestore
        +-- users / preferences
        +-- notes / tags / links
        +-- tasks / activity
        +-- plans / feedback
        +-- encrypted integration credentials (server-only access)
        |
        +-- Firebase Storage for private uploaded documents
```

The submitted college plan names Node/Express, Firebase/Firestore,
Firebase Authentication and Firebase Storage. Keep that direction unless
the team formally chooses otherwise.

## 2. Frontend modules

-   App shell and navigation.
-   Dashboard.
-   Inbox.
-   Calendar.
-   Notes.
-   Tasks.
-   AI assistant panel.
-   Settings/integrations.

Frontend must not contain Google client secrets, refresh tokens, LLM
secret keys, or privileged Firebase credentials.

## 3. Backend modules

### Auth

-   Application session validation.
-   Google OAuth start/callback.
-   Token refresh and revocation handling.

### Gmail service

-   Search/list messages.
-   Fetch selected message/thread.
-   Parse MIME body.
-   Normalize metadata.
-   Rate-limit and error handling.

### Calendar service

-   List calendars/events.
-   Normalize event times.
-   Handle recurring/all-day events.
-   Compute busy intervals.

### Notes/task services

-   Owner-scoped CRUD.
-   Validation and audit/activity events.
-   Search and relationship management.

### AI orchestration

-   Build minimal context.
-   Select allowed tools.
-   Enforce per-tool permissions.
-   Validate structured output.
-   Attach provenance/source references.

### Planner

-   Deterministic free/busy calculation.
-   Task scheduling constraints.
-   Conflict detection.
-   Plan explanation.

### ML service

-   Load trained Random Forest model.
-   Validate feature schema.
-   Return class/probability or score.
-   Log model version and inference metadata.
-   Provide baseline fallback if model service fails.

## 4. Suggested repository structure

``` text
workflow-ai/
  client/
    src/
      app/
      components/
      features/
        dashboard/
        inbox/
        calendar/
        notes/
        tasks/
        assistant/
        settings/
      hooks/
      lib/
      styles/
  server/
    src/
      routes/
      controllers/
      services/
      middleware/
      validators/
      integrations/
      ai/
      planner/
      config/
      app.ts
  ml/
    data/
    notebooks/
    src/
    models/
    tests/
  docs/
  firebase/
  README.md
  .env.example
```

## 5. Integration and data flow

### Google OAuth

1.  Browser requests backend OAuth start endpoint.
2.  Backend creates signed/random state and redirects to Google.
3.  Google returns authorization code and state.
4.  Backend validates state and exchanges code.
5.  Backend encrypts and stores refresh token.
6.  Backend uses access token to call Google APIs.
7.  Browser receives only normalized application data.

### AI request

1.  Client sends user prompt and active context identifier.
2.  Backend authenticates user and loads authorized context.
3.  Backend retrieves only required Gmail/calendar/note/task data.
4.  LLM returns answer or requests an allowed tool.
5.  Backend validates tool call and permissions.
6.  Backend executes read-only integrations or workspace-scoped
    operations.
7.  Response includes citations/source references and proposed actions.
8.  User explicitly confirms any workspace mutation.

## 6. Reliability and performance

-   Paginate Gmail and Calendar results.
-   Limit email body retrieval and AI context size.
-   Cache short-lived normalized read results where appropriate.
-   Never cache credentials in browser storage.
-   Use request timeouts and bounded retries for transient Google
    errors.
-   Respect provider quotas and rate limits.
-   Use loading skeletons and recoverable error states.
-   Add structured server logs without logging tokens or full email
    content.
-   Track latency and failures per integration.
