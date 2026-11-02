---
tags:
- decisions
- open-questions
- project-management
title: Decisions and Open Questions
---

# Confirmed product decisions

  -----------------------------------------------------------------------
  Decision                            Current position
  ----------------------------------- -----------------------------------
  Product                             AI Workspace / working name
                                      Workflow AI

  Core goal                           Minimize app switching and preserve
                                      focus

  Core modules                        Dashboard, Gmail, Calendar, Notes,
                                      Tasks, AI assistant

  Gmail permission                    Read-only in MVP

  Calendar permission                 Read-only in MVP

  External actions                    No Google write actions in MVP

  Notes                               First-class module, not an
                                      afterthought

  Assistant                           Contextual panel plus global
                                      workspace mode

  Clock                               Live local clock with
                                      timezone-aware backend logic

  Planning                            ML priority + deterministic
                                      scheduling + LLM explanation

  Academic baseline                   Preserve original eight-week scope
                                      and team role mapping
  -----------------------------------------------------------------------

# Decisions to confirm with the team

-   [ ] Final application name and branding.
-   [ ] Whether to retain Firebase/Firestore exactly as submitted.
-   [ ] Whether Firebase Authentication or another app-auth provider is
    used.
-   [ ] Which LLM provider and model will be used.
-   [ ] Whether the ML model is served through a Python API or batch
    inference.
-   [ ] Which document formats are supported in the first release.
-   [ ] Which member owns Google OAuth and integration security.
-   [ ] Whether the seven-day sprint is a prototype milestone or the
    final delivery target.
-   [ ] Whether mobile layout is a demo requirement or desktop-first is
    acceptable.

# Important product-policy clarification

The user wants read-only Gmail and Calendar access, and also wants
confirmation before sending emails or changing calendar events. These
are compatible only if the MVP does not offer those external write
actions. Confirmation is not a substitute for OAuth write permission. If
such actions are introduced later, add a separate opt-in permission
phase, explicit scopes, exact-action confirmation and audit logging.

# Risks

-   Google OAuth verification and restricted-scope requirements can
    affect public launch.
-   Gmail MIME parsing and email HTML safety can take longer than
    expected.
-   Calendar recurrence and timezone edge cases can break planning.
-   Synthetic ML labels may not represent real user priorities.
-   A broad feature set can undermine the one-week MVP.
-   AI output can invent dates or actions unless grounded and tested.
-   UI polish can be lost if implementation begins without a consistent
    design system.

# Current status

Use this page as the decision log. Add date, owner, decision and
rationale whenever the team resolves an open question.
