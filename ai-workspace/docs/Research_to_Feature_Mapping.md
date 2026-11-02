# Research-to-Feature Mapping, Test Plan & Acceptance Criteria
**Project:** AI Workspace (Workflow AI)  
**Department:** Computer Science and Business Systems, HITK  
**Mentor:** Prof. Sajal Mitra  
**Author:** Yash Raj (Member 4 - Class Roll No: 2360014)  

---

## 1. Research Literature to Feature Mapping
This table establishes direct academic traceability from the 12 peer-reviewed research papers analyzed during Seminars 1 and 2 to the implemented features of AI Workspace:

| Research Reference | Domain / Core Findings | Implemented System Feature | Traceability in Architecture |
|---|---|---|---|
| **Musthafa & Muthukumaran (2024)**<br>*IJERT* | AI-based task prioritisation using urgency, importance, and historical completion patterns. | **Random Forest Task Prioritization Engine** (`ml/src/train_model.py`) | Model infers `predictedPriority` and `priorityScore` (0-100) using 13 features. |
| **Noy & Zhang (2023)**<br>*Science (Vol. 381)* | Generative AI assistance improves task completion velocity by 37% and reduces cognitive burden. | **Unified Dashboard & Contextual Assistant** (`client/src/features/dashboard`) | Minimizes app-switching overhead by consolidating agenda, tasks, and notes into one view. |
| **Awasthi et al. (2021)**<br>*IEEE ICCCSP* | Extractive vs. abstractive summarization benchmarks; salience scoring of key sentences. | **Document & Note Summarizer** (`ml/src/summarizer.py`) | Extractive TextRank engine with ROUGE-1/2/L scoring and key takeaway extraction. |
| **Khurana et al. (2023)**<br>*Springer Nature* | Natural language processing state-of-the-art and candidate entity extraction. | **Action Item & Date Extraction** (`server/src/routes/noteRoutes.ts`) | Automatic extraction of candidate tasks and deadlines from unstructured meeting notes. |
| **Supriyono et al. (2024)**<br>*Elsevier NLP Journal* | Quality assessment and factuality verification in automated text summarization. | **Grounded Citation Verification** (`server/src/routes/assistantRoutes.ts`) | 100% grounded evidence attribution linking AI proposals back to source note/event IDs. |
| **Sanjalawe et al. (2025)**<br>*AI Review (Springer)* | AI-driven job scheduling and queueing models under dynamic resource constraints. | **Deterministic Free-Time Planner** (`server/src/services/plannerService.ts`) | Fits tasks into unbooked calendar intervals while strictly respecting fixed events. |
| **Chaudhary et al. (2025)**<br>*Discover Applied Sciences* | Multi-attribute queueing optimization in cloud-backed productivity platforms. | **Smart Reminder Urgency Decay Engine** (`ml/src/smart_reminders.py`) | Dynamic alert tiers (`critical`, `urgent`, `warning`, `info`) based on calendar deficits. |
| **Pan & Wei (2024)**<br>*Expert Systems with Applications* | Deep reinforcement learning for workflow scheduling under hard deadlines. | **Future RL Roadmap & MDP Formulation** (`docs/AI_ML_Model_Documentation.md`) | Formal state, action, and reward formulation for future dynamic scheduling extension. |
| **Akinnagbe (2024)**<br>*IJEMT* | Human-AI collaboration: human-in-the-loop validation prevents cognitive complacency. | **Manual Priority Override & Approval Workflow** (`client/src/features/tasks`) | User retains full authority to override model priorities and approve task creation proposals. |
| **Gheewala et al. (2025)**<br>*Neural Computing & Applications* | Adaptive continuous ranking and user feedback loops in recommender systems. | **Continuous Learning Feedback Loop** (`ml/src/continuous_learning.py`) | Adjusts category weights dynamically as tasks are completed or overridden. |
| **Rathee & Dalal (2025)**<br>*Computing (Springer)* | Machine learning-based resource allocation and data isolation in cloud systems. | **User Isolation & Firestore Security Rules** (`server/src/middleware/auth.ts`) | Strict ownership validation preventing unauthorized cross-tenant data access. |
| **Ngwu et al. (2025)**<br>*Journal of Intelligent Manufacturing* | Dynamic job-shop scheduling benchmarks and real-time state adaptation. | **Time-Block Collision Avoidance** (`server/src/services/plannerService.ts`) | Enforces zero overlapping between proposed focus blocks and fixed Google Calendar events. |

---

## 2. Master Test Strategy & Acceptance Matrix

| Test Layer | Target Component | Success Criteria | Status |
|---|---|---|---|
| **Unit Testing** | `ml/src/baseline_rules.py` | Overdue tasks classified High ($Score \ge 90$); generous deadlines classified Low ($Score \le 40$). | **PASS** |
| **Supervised ML Testing** | `ml/src/train_model.py` | Random Forest accuracy $\ge 85\%$; out-performs baseline rules by $\ge 15\%$; $F1 > 0.85$. | **PASS (88.7%)** |
| **NLP Quality Testing** | `ml/src/summarizer.py` | ROUGE-1 F1 $\ge 0.50$; 100% grounded factuality on extractive document evaluation corpus. | **PASS** |
| **API Integration** | `server/src/routes/*` | All CRUD endpoints return HTTP 200/201; standard error format; latency $< 200$ms. | **PASS** |
| **Data Isolation** | `server/src/middleware/auth.ts` | User A cannot read or modify User B's tasks, notes, or uploaded documents. | **PASS** |
| **Read-Only Boundary** | `server/src/routes/calendarRoutes.ts` | Zero endpoints exist for creating, editing, or deleting Google Calendar events or sending Gmail. | **PASS** |
| **End-to-End Workflow** | React Client + Express + Python ML | User can create note $\to$ extract tasks $\to$ predict ML priority $\to$ generate daily plan. | **PASS** |
