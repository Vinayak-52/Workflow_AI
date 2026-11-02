# Frontend Workflow and Dashboard Features Demonstration
**Seminar 4 / Final Evaluation Document**  
**Group:** 7 | **Course:** CBS3293 | **HITK**  
**Author:** Vinayak Chandra (Member 3 - Class Roll No: 2360035)  
**Mentor:** Prof. Sajal Mitra  

---

## 1. End-to-End Walkthrough Demonstration Script

### Step 1: Start the Day & Review Morning Dashboard
1. Open the AI Workspace application (`http://localhost:3000`).
2. The TopBar immediately synchronizes with the server-side live clock displaying real-time Indian Standard Time (`Asia/Kolkata`).
3. The Dashboard automatically renders:
   - 4 pending tasks across Academic, Project, and Administrative categories.
   - 2 fixed calendar commitments: *CBS3293 Cloud & Distributed Systems Lecture (10:00 AM)* and *Project Review with Prof. Sajal Mitra (2:30 PM)*.
   - 1 High-priority overdue reminder banner.

### Step 2: Task Prioritization with Machine Learning
1. Navigate to the **Tasks** module.
2. Click **+ Add Task** and input:
   - Title: `Submit Final Seminar Presentation Slides`
   - Category: `Academic`
   - User Priority: `Medium`
   - Due Date: Set within 4 hours from now.
   - Estimated Duration: `90 minutes`
3. Click **Create & Predict Priority**.
4. The frontend calls the backend REST API (`POST /api/v1/tasks`), which executes the **Random Forest classifier**.
5. Even though the user selected `Medium`, the model detects a critical deadline proximity ($<4$h) and time deficit, automatically escalating the prediction to `HIGH` (Priority Score: `92.5`).
6. The UI displays the ML recommendation badge and updates the sorting order.

### Step 3: Calendar Free-Time Scheduling & Deterministic Daily Planner
1. Navigate to the **Calendar & Schedule** module.
2. View the Free Time Analysis card:
   - Identifies total available unbooked working minutes today ($360$ min).
   - Graphically separates fixed calendar meetings (gray outline) from proposed focus blocks (indigo border).
3. Click **Regenerate Plan**:
   - The deterministic planner fits the highest-priority tasks into open calendar windows.
   - Inserts 15-minute recovery breaks between focus sessions.
   - Verifies that Google Calendar remains completely unmodified (strictly read-only).

### Step 4: Document Upload & NLP Summarization
1. Navigate to **Docs & Summary**.
2. Upload the seminar report or a project brief (`.pdf`, `.docx`, or `.txt`).
3. The extractive summarizer computes sentence centrality and displays:
   - A concise 3-sentence summary.
   - Bulleted key takeaways.
   - 100% grounded factuality rating with zero hallucination.

### Step 5: Grounded Contextual AI Assistant
1. Click the **AI Assistant** pill in the top right.
2. Type: `"Plan the rest of my day around my meetings"`.
3. The assistant generates a grounded agenda linking directly to calendar event IDs and task IDs with citations.
4. Type: `"Extract tasks from my meeting notes"`.
5. The assistant proposes action items with one-click **Add Task** approval buttons.
