# Frontend Architecture, Wireframes & Component Plan
**Project:** AI Workspace (Workflow AI)  
**Department:** Computer Science and Business Systems, HITK  
**Mentor:** Prof. Sajal Mitra  
**Author:** Vinayak Chandra (Member 3 - Class Roll No: 2360035)  

---

## 1. UX Principles & Visual Design System
Aligned with `03 - UX and Visual Design System.md`:
- **Dark-First Charcoal Surfaces:** Base background `#0d1117`, card surface `#161b22`, border `#21262d`.
- **Restrained Semantic Accent Color:** Indigo/Brand accent (`#6366f1` / `#38bdf8`) used strictly for primary focus states and ML scores.
- **Persistent Navigation:** User maintains focus context without losing input state during multi-module workflows.
- **Contextual Assistance Sidecar:** Right-side AI slide-out drawer providing grounded suggestions without hijacking screen real estate.
- **Strict Read-Only Boundary Badging:** External Google Calendar & Gmail views carry prominent read-only indicators.

---

## 2. Component Hierarchy Plan

```
App
└── AppShell
    ├── Sidebar (Collapsible, active module navigation)
    ├── TopBar
    │   ├── Breadcrumb navigation
    │   ├── LiveClock (Timezone-aware IST clock, 1s heartbeat)
    │   ├── Quick Action (+ New Task modal)
    │   └── Assistant Toggle (With unread recommendation badge)
    ├── Main View Container
    │   ├── DashboardView (Agenda, priority tasks, overdue alerts, schedule card)
    │   ├── TasksView (List view, priority badges, category filters, ML re-eval)
    │   ├── NotesView (Split pane: search list + Markdown editor with autosave)
    │   ├── CalendarView (Agenda + Day timeline, free time calculation)
    │   ├── DocumentsView (Upload dropzone, extractive summary, key takeaways)
    │   ├── RemindersView (Context-aware alert tiers: Critical/Urgent/Warning)
    │   └── SettingsView (Working hours, timezone, read-only policy)
    └── AssistantPanel (Slide-out drawer with grounded citations)
```

---

## 3. Wireframe Specifications

### A. Dashboard / Today
- **Hero Banner:** Dynamic time-of-day greeting, local IST clock, pending task counter, scheduled meeting counter.
- **KPI Grid:** 4 structured summary widgets (Pending, High ML Priority, Calendar Meetings, Completed).
- **Overdue Alert Ribbon:** Highlights urgent tasks with time-deficit warnings.
- **Daily Schedule Timeline:** Chronological focus blocks scheduled into available intervals outside fixed calendar meetings.

### B. Tasks & Prioritization
- **Toolbar:** Real-time search by keyword, multi-dropdown filters (Status, Priority, Category).
- **Task Card:**
  - Checkbox with optimistic completion state.
  - Category pill badge (`academic`, `project`, `administrative`, `personal`).
  - ML Priority Score badge (0 - 100) from the Random Forest model.
  - Manual override indicator (`Override: high`) if user modified priority.
  - Action buttons: Force re-predict, Edit, Delete.

### C. Notes & Markdown Editor
- **Left Panel (Width 320px):** Searchable list with tag chips and pinned icons.
- **Right Panel:** Full-height Markdown textarea with autosave heartbeat indicator ("Saving...", "Saved at 12:34 PM").
- **AI Toolbelt:** One-click Summarize Note and Extract Action Items into Workspace Tasks.
