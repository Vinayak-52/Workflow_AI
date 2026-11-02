---
tags:
- workflow-ai
- index
- project
title: Workflow AI --- Project Vault
---

# Workflow AI --- Project Vault

> **Product vision:** A unified productivity workspace that helps users
> think, capture, organize, understand, and plan without constantly
> switching applications.

This Obsidian vault is the product and engineering source of truth for
Claude and Antigravity. Read this page first, then follow the linked
specifications.

## Product principles

1.  **One workspace, not four disconnected integrations.** Notes, tasks,
    Gmail, Calendar, and the AI assistant share context.
2.  **Contextual assistance.** The AI should be available beside the
    current work and understand the active note, email, task, or
    calendar view.
3.  **User control.** Google integrations are read-only in the MVP. The
    AI may draft suggestions, but must not send emails or create, edit,
    or delete Google Calendar events.
4.  **Focus over feature count.** Minimize navigation, interruptions,
    and app switching.
5.  **Evidence over hallucination.** Email-derived dates, event details,
    and recommendations should link back to their source.
6.  **Separate responsibilities.** ML predicts task priority; the LLM
    interprets natural language and summarizes; deterministic
    application logic validates time constraints and permissions.

## Read these documents in order

1.  \[\[01 - Product Requirements\]\]
2.  \[\[02 - Original College Plan Mapping\]\]
3.  \[\[03 - UX and Visual Design System\]\]
4.  \[\[04 - Functional Requirements\]\]
5.  \[\[05 - Technical Architecture\]\]
6.  \[\[06 - Data Model\]\]
7.  \[\[07 - API Specification\]\]
8.  \[\[08 - AI and ML Specification\]\]
9.  \[\[09 - Security and Privacy\]\]
10. \[\[10 - Seven Day MVP Build Plan\]\]
11. \[\[11 - Eight Week Academic Roadmap\]\]
12. \[\[12 - Testing and Acceptance Criteria\]\]
13. \[\[13 - Claude and Antigravity Build Instructions\]\]
14. \[\[14 - Decisions and Open Questions\]\]

## MVP definition

A user can sign in, connect Google with explicit consent, view Gmail
messages and Calendar events, see a live clock, create and edit notes
and tasks, and ask the AI to generate a grounded daily plan using those
sources. Google data remains read-only. The user approves any proposed
task creation in the workspace; no external Google write action is
available in the MVP.

## Current project constraints

-   Academic project: **AI Workspace**, Department of Computer Science
    and Business Systems, HITK.
-   Original plan: eight weeks, four members.
-   Original stack direction: React, Node/Express, Firebase/Firestore,
    Firebase Authentication, Firebase Storage, Python/scikit-learn.
-   The new product scope extends the submitted plan; it should not
    silently discard the Random Forest prioritization, smart reminders,
    document summarization, notes, recommendation panel, testing, and
    deployment work.
-   Preferred MVP implementation can use React + Vite + TypeScript +
    Tailwind, Express, Firebase, Python/scikit-learn, Gmail API, Google
    Calendar API, and an LLM API. Confirm final stack decisions in
    \[\[14 - Decisions and Open Questions\]\].

## Status convention

Use `Not started`, `In progress`, `Blocked`, `Done`, or `Deferred`. Do
not mark a feature Done until its acceptance criteria pass.
