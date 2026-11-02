---
tags:
- prd
- product
- requirements
title: Workflow AI --- Product Requirements
---

# 1. Product overview

**Working name:** Workflow AI\
**Category:** Unified AI productivity workspace\
**Primary outcome:** Reduce context switching by bringing notes, tasks,
email context, calendar context, and AI assistance into one focused
interface.

Workflow AI is not intended to be a full replacement for Gmail or Google
Calendar. It is a focused workspace that surfaces the information users
need and helps them turn it into organized work.

## 2. Problem statement

People move between email, calendars, notes, task managers, and AI chat
tools to understand what needs to be done. This creates fragmented
context, repeated copying, missed action items, and loss of focus.

Workflow AI should: - Bring relevant information into one interface. -
Connect related information across modules. - Make capture and retrieval
fast. - Help users prioritize and plan. - Keep users in control of
external actions.

## 3. Target users

### Primary

Students, early-career professionals, and individual knowledge workers
who manage deadlines, emails, meetings, notes, and personal projects.

### Secondary

Small teams or project groups that need lightweight task planning and
shared project context. Team collaboration is not part of the first MVP.

## 4. Product goals

-   Reduce the number of app switches required for routine planning.
-   Make it possible to understand today's priorities from one
    dashboard.
-   Convert relevant information from emails and notes into proposed
    tasks.
-   Plan work around existing calendar commitments.
-   Provide a fast, attractive, dependable notes experience.
-   Demonstrate meaningful ML, AI, backend, and frontend engineering.

## 5. Non-goals for the MVP

-   Replacing Gmail or Google Calendar.
-   Sending emails or modifying Google Calendar events.
-   Real-time collaborative editing.
-   Full Notion-style block editor.
-   Autonomous browser agent.
-   Multi-agent orchestration.
-   Offline multi-device synchronization.
-   Public multi-tenant launch with completed OAuth verification.
-   Automatic reinforcement learning in production.

## 6. Core user journeys

### Journey A --- Start the day

1.  User opens the dashboard.
2.  Workspace displays local time and date.
3.  It loads today's calendar events.
4.  It shows important/recent emails and saved tasks.
5.  AI proposes priorities and a time-blocked plan.
6.  User reviews and adjusts the plan.

### Journey B --- Email to task

1.  User searches or opens an email in the Inbox module.
2.  AI summarizes the message.
3.  AI extracts possible action items and dates.
4.  Each extracted item cites the source email.
5.  User chooses whether to save a task in Workflow AI.
6.  No email is sent and no Google event is created.

### Journey C --- Note to action

1.  User creates or opens a note.
2.  User writes or pastes content.
3.  Autosave persists changes.
4.  User asks AI to summarize, restructure, or extract tasks.
5.  User reviews suggestions and selectively saves tasks.

### Journey D --- Plan around calendar

1.  User selects a date or asks for a daily plan.
2.  Backend fetches calendar events for that date.
3.  Scheduling logic identifies available intervals.
4.  Tasks are ranked using model output plus deterministic constraints.
5.  AI presents proposed time blocks with reasons.
6.  User can save the plan inside Workflow AI.
7.  Google Calendar remains unchanged.

## 7. Product success measures

For the academic prototype, measure: - Completion rate of the main user
journeys. - Time required to create and retrieve a note. - Accuracy of
task extraction on a labelled test set. - Quality of task-priority
predictions against a baseline. - Correctness of free-time
calculations. - Percentage of AI factual claims with valid source
references. - API success/error rates and page responsiveness. -
Usability feedback from a small group of test users.

Do not claim productivity improvement without user-study evidence.
