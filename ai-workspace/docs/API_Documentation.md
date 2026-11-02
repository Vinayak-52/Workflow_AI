# AI Workspace - REST API Documentation
**Department:** Computer Science and Business Systems, HITK  
**Author:** Ankit Kumar Kunwar (Member 2 - Class Roll No: 2360031)  
**Base URL:** `http://localhost:5000/api/v1`  
**Authentication:** Bearer JWT in `Authorization` header (`Authorization: Bearer <TOKEN>`)

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new user account with default working hours and timezone.
- **Request Body:**
  ```json
  {
    "email": "student@hitk.edu.in",
    "password": "securepassword",
    "displayName": "CSBS Student"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": { "id": "usr-12345678", "email": "student@hitk.edu.in", "displayName": "CSBS Student" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### `POST /auth/login`
Authenticates credentials and returns a 7-day valid session token.

### `GET /auth/me`
Retrieves authenticated user profile and preference settings.

### `GET /auth/integrations`
Returns external integration status and scopes.
- Notice: strictly read-only (`gmail.readonly`, `calendar.readonly`).

---

## 2. Task Management Endpoints

### `GET /tasks`
List user tasks with optional query filters:
- `?status=todo|in_progress|done`
- `?priority=low|medium|high`
- `?category=academic|project|administrative|personal`
- `?q=search_string`

### `POST /tasks`
Creates a new task. Automatically triggers the **Random Forest ML prioritization engine** to predict `predictedPriority` and `priorityScore` (0-100).
- **Request Body:**
  ```json
  {
    "title": "Prepare Seminar 4 Demo Slides",
    "description": "Outline methodology and results",
    "category": "academic",
    "userPriority": "high",
    "dueAt": "2026-11-05T17:00:00+05:30",
    "estimatedMinutes": 90,
    "dependencyCount": 1
  }
  ```

### `PATCH /tasks/:id`
Updates task fields. If `userPriority` is modified, automatically transmits an override feedback event to the continuous learning engine.

### `DELETE /tasks/:id`
Permanently deletes the specified task.

### `POST /tasks/:id/priority`
Forces on-demand re-evaluation of task priority using updated calendar free time and deadline proximity.

---

## 3. Notes Management Endpoints

### `GET /notes`
Search and list notes (supports `?q=` text search and `?tag=` filtering). Returns pinned notes first.

### `POST /notes`
Creates a new note.

### `PATCH /notes/:id`
Autosave endpoint. Updates title, markdown content, tags, or pinned status.

### `POST /notes/:id/ai`
Executes AI transformations on note content:
- `action: "summarize"`: returns extractive summary and key takeaways.
- `action: "extract_tasks"`: extracts candidate action items for one-click creation.

---

## 4. Calendar & Live Clock Endpoints (Read-Only)

### `GET /calendar/events`
Returns calendar events within `timeMin` and `timeMax` range.

### `GET /calendar/freebusy`
Calculates unbooked free time slots between working hours (09:00 - 18:00) minus fixed calendar commitments.

### `GET /clock`
Returns server-authoritative live clock timestamp and timezone offset (`Asia/Kolkata`).

---

## 5. Daily Planner Endpoints

### `POST /planner/daily`
Executes the deterministic planning algorithm:
1. Normalizes calendar events to detect fixed commitments.
2. Identifies unbooked free intervals.
3. Ranks pending tasks by ML priority score.
4. Allocates focus blocks and 15-minute recovery breaks into available slots without overlapping calendar events.
5. Flags workload conflicts if high-priority tasks cannot fit into today's schedule.

---

## 6. Smart Reminders Endpoints

### `GET /reminders/smart-eval`
Evaluates all active tasks against urgency decay, time deficit, and pending workload. Returns prioritized alerts:
- `level: "critical"` (overdue tasks)
- `level: "urgent"` (deadline $< 3$h or time deficit)
- `level: "warning"` (upcoming within 24h)
- `level: "info"` (on schedule)

### `PATCH /reminders/:id/dismiss`
Dismisses an active alert.

---

## 7. Document Upload & Summarization Endpoints

### `POST /documents/upload`
Uploads a document (`multipart/form-data`), extracts text, and generates an initial summary with factuality score.

### `POST /documents/:id/summarize`
Generates deep summary with customizable sentence limit and ROUGE evaluation.

---

## 8. ML Model Input & Activity Logging Endpoints

### `POST /ml/predict-priority`
Direct model-input endpoint accepting feature vectors for ML inference testing.

### `GET /activity`
Returns audit logs of workspace actions for compliance and regression traceability.
