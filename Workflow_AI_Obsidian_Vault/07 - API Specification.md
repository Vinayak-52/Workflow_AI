---
tags:
- api
- endpoints
- contracts
title: API Specification
---

# 1. Conventions

-   Base path: `/api/v1`
-   JSON request/response bodies.
-   Authenticated endpoints require a valid application session.
-   Use consistent errors:
    `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`.
-   Validate all inputs server-side.
-   Use pagination for list endpoints.
-   Never expose Google tokens to the browser.

# 2. Authentication and integration

  -------------------------------------------------------------------------
  Method                  Endpoint                  Purpose
  ----------------------- ------------------------- -----------------------
  GET                     `/auth/google`            Start Google OAuth

  GET                     `/auth/google/callback`   Validate callback and
                                                    store credentials

  GET                     `/integrations`           List connection status
                                                    and granted scopes

  DELETE                  `/integrations/google`    Disconnect/revoke
                                                    Google access
  -------------------------------------------------------------------------

# 3. Gmail

  Method   Endpoint                          Purpose
  -------- --------------------------------- -------------------------------
  GET      `/gmail/messages?q=&pageToken=`   Search/list messages
  GET      `/gmail/messages/:messageId`      Fetch selected message
  GET      `/gmail/threads/:threadId`        Fetch selected thread
  POST     `/gmail/summarize`                Summarize selected messages
  POST     `/gmail/extract-actions`          Extract candidate tasks/dates

Read-only restrictions: no send, compose, modify, trash, archive, label,
or mark-read endpoint.

# 4. Calendar and clock

  ----------------------------------------------------------------------------------------
  Method                  Endpoint                                 Purpose
  ----------------------- ---------------------------------------- -----------------------
  GET                     `/calendar/calendars`                    List calendars

  GET                     `/calendar/events?timeMin=&timeMax=`     List events

  GET                     `/calendar/freebusy?timeMin=&timeMax=`   Calculate busy/free
                                                                   intervals

  GET                     `/clock?timezone=`                       Return current time
                                                                   metadata
  ----------------------------------------------------------------------------------------

Clock response example:

``` json
{
  "now": "2026-10-30T12:00:00+05:30",
  "timezone": "Asia/Kolkata",
  "utcOffset": "+05:30"
}
```

This is an illustrative contract. The server should generate the actual
timestamp.

# 5. Notes

  Method   Endpoint              Purpose
  -------- --------------------- -------------------
  GET      `/notes?q=&cursor=`   List/search notes
  POST     `/notes`              Create note
  GET      `/notes/:noteId`      Get note
  PATCH    `/notes/:noteId`      Update note
  DELETE   `/notes/:noteId`      Delete note
  POST     `/notes/:noteId/ai`   AI action on note

# 6. Tasks and plans

  Method   Endpoint                      Purpose
  -------- ----------------------------- ---------------------------------
  GET      `/tasks?status=&dueBefore=`   List tasks
  POST     `/tasks`                      Create workspace task
  GET      `/tasks/:taskId`              Get task
  PATCH    `/tasks/:taskId`              Update task
  DELETE   `/tasks/:taskId`              Delete task
  POST     `/tasks/:taskId/priority`     Get/refresh priority prediction
  POST     `/planner/daily`              Generate daily plan
  GET      `/plans/:planId`              Get saved plan
  POST     `/plans`                      Save reviewed plan

# 7. Assistant

`POST /assistant/chat`

Request:

``` json
{
  "message": "Plan the rest of my day",
  "context": {
    "type": "global",
    "id": null
  }
}
```

Response:

``` json
{
  "answer": "Here is a proposed plan...",
  "sources": [
    {
      "type": "calendar_event",
      "id": "provider-event-id",
      "label": "Project review"
    }
  ],
  "proposals": [],
  "warnings": []
}
```

The assistant must not claim that proposed actions have been executed.
Workspace mutations require an explicit confirmation step and
server-side authorization.

# 8. API acceptance requirements

-   Correct HTTP status codes.
-   Validation errors are actionable.
-   Unauthorized users cannot access another user's data.
-   Google API errors are normalized and logged safely.
-   Rate limits and pagination are handled.
-   No write endpoints exist for Gmail or Google Calendar in the MVP.
