# Defect Tracking Log & Quality Assurance Report
**Project:** AI Workspace (Workflow AI)  
**Author:** Yash Raj (Member 4 - Class Roll No: 2360014)  
**Mentor:** Prof. Sajal Mitra  

---

## Defect Summary Register

| Defect ID | Severity | Module | Description | Root Cause | Status / Resolution |
|---|---|---|---|---|---|
| **DEF-001** | High | Machine Learning / Generator | `priority_label` initial synthetic generator yielded only 3 high-priority samples out of 5,000 due to unnormalized composite weights. | The composite threshold was set to $\ge 65.0$, but component weights only summed to $\sim 60.0$. | **Resolved:** Re-calibrated scoring formula with realistic distribution (~21% High, ~48% Medium, ~31% Low). |
| **DEF-002** | Medium | Server / Task Routes | Priority override failed to pass user feedback into the continuous learning feedback buffer. | Route handler omitted feedback trigger when `userPriority` changed. | **Resolved:** Added `MLClient.recordFeedback()` call in `taskRoutes.ts` PATCH handler. |
| **DEF-003** | Medium | Planner Service | Proposed focus blocks overlapped when calendar event end time equaled focus block start time. | Date comparison used strict inequality instead of chronological intervals. | **Resolved:** Standardized interval boundary slicing in `plannerService.ts`. |
| **DEF-004** | Low | Notes Module | Autosave triggered unnecessary HTTP PATCH calls on every keystroke without debounce. | React state updated synchronously on every input change. | **Resolved:** Implemented `useRef` 800ms debounce timer in `NotesView.tsx`. |
| **DEF-005** | High | Security Boundary | Risk of external Google write actions if client sent unauthorized modification payloads. | Potential scope escalation. | **Resolved:** Completely eliminated all Google write endpoints and hardcoded read-only scopes in server configuration. |
| **DEF-006** | Low | Client UI | Live clock experienced momentary layout shift during initial font loading. | Unfixed monospace font sizing. | **Resolved:** Applied fixed-width numeric tabular layout (`font-mono`) in `LiveClock.tsx`. |
