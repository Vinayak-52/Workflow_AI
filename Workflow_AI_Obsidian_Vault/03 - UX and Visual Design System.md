---
tags:
- ux
- ui
- design-system
title: UX and Visual Design System
---

# 1. Design direction

Create a premium, calm, highly legible productivity interface. It should
feel like a professional desktop workspace, not a flashy AI demo.

**Recommended visual direction:** dark-first, neutral charcoal surfaces,
restrained accent color, subtle borders, clear typography, generous
spacing, and purposeful motion. Support light mode if time permits, but
perfect one theme first.

## 2. UX principles

1.  **Persistent navigation:** users should not lose their place when
    switching modules.
2.  **Contextual AI:** assistant opens beside the current content and
    inherits relevant context.
3.  **Global assistant:** users can explicitly ask questions across all
    connected modules.
4.  **Low-friction capture:** creating a note or task should take very
    few interactions.
5.  **Keyboard-first navigation:** provide a command palette and
    shortcuts.
6.  **Progressive disclosure:** show essential information first; expose
    advanced controls only when needed.
7.  **Visible system status:** show loading, syncing, connection, save,
    and error states.
8.  **No deceptive UI:** clearly distinguish real Google events from
    proposed workspace time blocks.

## 3. Application shell

### Desktop layout

-   **Left sidebar:** logo/workspace switcher, Home, Inbox, Calendar,
    Notes, Tasks, Projects/Files if implemented, Settings.
-   **Main content:** active module.
-   **Optional right panel:** contextual AI assistant, details, or
    selected-item metadata.
-   **Top bar:** page title/breadcrumb, global search/command palette,
    quick capture, live clock, profile/integration status.

Recommended behavior: - Sidebar can collapse. - AI panel can open/close
without changing the active module. - On smaller screens, right panel
becomes a drawer. - Preserve active selection and scroll position where
practical.

## 4. Required screens

### A. Onboarding and integrations

-   Welcome and concise product explanation.
-   Connect Google button.
-   Explain Gmail and Calendar read-only access before consent.
-   Show connected Google account and granted scopes.
-   Show connection error, reconnect, and disconnect states.
-   Do not imply that email/calendar changes are supported.

### B. Dashboard / Today

-   Greeting, date, live local time.
-   Today's agenda and next event.
-   Priority tasks and overdue tasks.
-   Recent/important email summaries.
-   Recently edited/pinned notes.
-   AI daily-plan card.
-   Quick note and quick task actions.

### C. Inbox

-   Message list with sender, subject, date, unread/important indicators
    where available.
-   Search and pagination.
-   Message detail view.
-   AI summary and extracted action items.
-   Source message reference.
-   Draft response suggestion displayed as text only; no send action in
    MVP.

### D. Calendar

-   Day and week views if feasible; day view is MVP priority.
-   Current-time indicator.
-   Event cards with start/end and calendar label.
-   Free-time intervals.
-   Proposed work blocks visually distinct from actual Google events.
-   Clear timezone display.
-   No create/edit/delete Google event controls.

### E. Notes

-   Notes list with search, tags, pinned state and last-edited time.
-   Editor with title and Markdown/rich-text basics.
-   Autosave indicator: Saving, Saved, Offline/Error.
-   AI actions: summarize, rewrite selection, outline, extract tasks.
-   Link notes to workspace tasks and email references.
-   Empty, loading, error and unsaved-change states.

### F. Tasks

-   List and board views; list view is MVP priority.
-   Title, description, due date, status, priority, estimated duration.
-   Filters for status, priority and due date.
-   Manual priority override.
-   Show model recommendation separately from user-selected priority.
-   Task completion history for later model evaluation.

### G. AI assistant

-   Chat interface in right-side panel.
-   Context chip: current note, selected email, selected task, or global
    workspace.
-   Suggested prompts.
-   Source references for claims drawn from email/calendar/notes.
-   Clear distinction between suggestion and completed action.
-   Confirmation before creating a workspace task from an AI suggestion.
-   Never offer Google write actions in the read-only MVP.

### H. Settings

-   Profile and timezone.
-   Google connection status and permissions.
-   Disconnect Google.
-   Theme and basic preferences.
-   Data/privacy information.

## 5. Visual quality requirements

-   Consistent spacing scale and typography hierarchy.
-   Reusable buttons, inputs, cards, badges, menus, dialogs and empty
    states.
-   Avoid excessive gradients, glassmorphism, neon glows and decorative
    charts.
-   Use accent color sparingly for primary actions and focus states.
-   Use semantic colors consistently for status and priority.
-   Ensure contrast and keyboard focus visibility.
-   Use skeletons for data-loading states.
-   Use subtle transitions; respect reduced-motion preference.
-   Avoid layout shift when async data loads.
-   Do not use placeholder content in production demo flows without
    labelling it as sample data.

## 6. Component inventory

-   `AppShell`, `Sidebar`, `TopBar`, `CommandPalette`
-   `ContextualAssistant`, `ChatMessage`, `SourceCitation`
-   `LiveClock`, `TodayHeader`, `AgendaList`, `EventCard`
-   `EmailList`, `EmailDetail`, `EmailSummary`
-   `NotesList`, `NoteEditor`, `MarkdownToolbar`, `SaveStatus`
-   `TaskList`, `TaskCard`, `PriorityBadge`, `TaskFilters`
-   `DailyPlan`, `TimeBlock`, `FreeTimeIndicator`
-   `IntegrationCard`, `ConnectionStatus`
-   `ConfirmDialog`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`

## 7. Accessibility and responsive behavior

-   Semantic HTML and labelled form controls.
-   Full keyboard access for primary workflows.
-   Visible focus states.
-   Appropriate contrast.
-   Screen-reader labels for icon-only buttons.
-   Responsive layouts for laptop, tablet and mobile widths.
-   Avoid hover-only controls for essential actions.
