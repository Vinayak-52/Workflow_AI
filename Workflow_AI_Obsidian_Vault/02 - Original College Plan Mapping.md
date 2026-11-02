---
tags:
- academic
- scope
- traceability
title: Original College Plan Mapping
---

# 1. Source plan

The submitted document is titled **Eight Weeks Plan**, for the
Department of Computer Science and Business Systems, HITK. Project
title: **AI Workspace**. Mentor: **Prof. Sajal Mitra**.

The submitted team assignments are:

  -----------------------------------------------------------------------
  Member                              Original responsibility
  ----------------------------------- -----------------------------------
  Ayantik Goswami                     ML requirements, task-priority
                                      model, reminders, model evaluation

  Ankit Kumar Kunwar                  Git/backend/database, APIs,
                                      authentication, storage, deployment

  Vinayak Chandra                     React project, dashboard, task UI,
                                      calendar, notes, document and
                                      summary screens, UI polish

  Yash Raj                            Research mapping, test plan, API
                                      testing, model/document evaluation,
                                      user testing, QA and documentation
  -----------------------------------------------------------------------

## 2. Original eight-week scope

  -----------------------------------------------------------------------
  Week                                Original planned work
  ----------------------------------- -----------------------------------
  1                                   ML requirements and workflow; Git,
                                      Node/Express and database; React
                                      dashboard wireframe; research
                                      mapping and acceptance criteria

  2                                   Synthetic task dataset and baseline
                                      rules; task/note/user/deadline
                                      APIs; login/dashboard/task-create
                                      screens; prioritization metrics

  3                                   Initial Random Forest
                                      task-prioritization model;
                                      Firebase/Firestore and
                                      authentication; task CRUD UI; API
                                      testing

  4                                   Smart reminders using urgency,
                                      deadlines, workload and available
                                      time; reminder service; calendar,
                                      priority labels, filters and
                                      reminder settings; reminder testing

  5                                   Pre-trained summarization model;
                                      document upload and Firebase
                                      Storage; upload, notes and summary
                                      screens; document evaluation

  6                                   Improve priority model using
                                      completion-history feedback;
                                      activity logging and validation;
                                      recommendation panel and responsive
                                      UI; integration testing

  7                                   Document model, limitations and
                                      future RL enhancement; deployment
                                      and API docs; accessibility and
                                      demo polish;
                                      user/security/regression testing

  8                                   Present model results; deploy
                                      prototype; demonstrate frontend;
                                      final test report, references,
                                      risks and QA
  -----------------------------------------------------------------------

## 3. How the new product scope maps to the submitted plan

  -----------------------------------------------------------------------
  Added capability                    Existing academic work it extends
  ----------------------------------- -----------------------------------
  Gmail read-only integration         AI workflow, task extraction,
                                      recommendation panel

  Google Calendar read-only           Calendar UI, available-time logic,
  integration                         smart reminders

  Live clock and timezone awareness   Deadline proximity and
                                      available-time calculations

  Rich notes workspace                Original notes and document screens

  AI note assistance                  Summarization and recommendation
                                      panel

  Cross-module assistant              AI workflow and recommendation
                                      panel

  Daily planner                       Random Forest prioritization, smart
                                      reminders and available-time logic

  Source citations                    Evaluation, factuality, testability
                                      and explainability
  -----------------------------------------------------------------------

## 4. Academic integrity and scope control

The submitted plan does not explicitly mention Gmail integration, Google
OAuth, a live clock, or a cross-module assistant. These are
product-scope extensions proposed after submission. Present them as
extensions, not as items that were already in the original document.

The submitted plan explicitly mentions Random Forest, synthetic task
data, baseline priority rules, completion-history feedback, and a future
RL enhancement. Keep those concepts visible in the final implementation
and report. Do not replace the ML component with an LLM-only
prioritizer.

## 5. Responsibility continuity

The original role allocation can remain the default ownership map. The
team should explicitly agree who owns Google OAuth, integration testing,
AI orchestration, and security review. Do not assume these new
responsibilities are already assigned by the submitted document.
