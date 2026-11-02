# AI Workspace (Workflow AI)
**Department of Computer Science and Business Systems, HITK**  
**Course:** CBS3293 - Term Paper and Seminar  
**Mentor:** Prof. Sajal Mitra  

### Team Members
- **Member 1 (2360006):** Ayantik Goswami (Machine Learning, Random Forest Prioritization, Smart Reminders)
- **Member 2 (2360031):** Ankit Kumar Kunwar (Node/Express Backend, Database, Cloud Deployment)
- **Member 3 (2360035):** Vinayak Chandra (React + TypeScript Frontend, Dashboard, Calendar, UI/UX)
- **Member 4 (2360014):** Yash Raj (Research Mapping, Testing, QA, Acceptance Criteria)

---

## Architecture Overview
The project implements a cohesive, robust 3-layer architecture:
1. **Frontend (React + Vite + TypeScript + Tailwind CSS):**
   - Live timezone-aware clock (`Asia/Kolkata`)
   - Dashboard with today's agenda, pending tasks, overdue alerts, and daily schedule plan
   - Task manager with ML priority scores and manual user override tracking
   - Notes module with split-pane Markdown editor and debounced autosave
   - Calendar & Free Time schedule analyzer (strictly read-only)
   - Document upload & NLP extractive summarizer with ROUGE metrics
   - Contextual AI Assistant slide-out drawer with grounded citations
2. **Backend (Node.js + Express + TypeScript):**
   - Full REST API suite under `/api/v1` (`/auth`, `/tasks`, `/notes`, `/deadlines`, `/reminders`, `/documents`, `/calendar`, `/planner`, `/assistant`, `/activity`, `/ml`, `/clock`)
   - Firestore schema with dual-mode persistent JSON storage
   - Deterministic planning engine allocating tasks into free calendar windows
   - Strictly enforced read-only boundaries on Google services
3. **AI/ML Layer (Python 3.14 + scikit-learn):**
   - Synthetic dataset generator ($N = 5,000$ realistic academic & project tasks)
   - Trained `RandomForestClassifier` with 88.70% test accuracy (+30.80% over baseline rules)
   - Context-aware smart reminders engine evaluating urgency, deadlines, workload, and available time
   - NLP extractive TextRank summarizer with ROUGE-1/2/L evaluation
   - Continuous learning feedback loop adapting to user completion patterns

---

## Quick Start Instructions

### 1. Run Automated Test Suites
```bash
# Test Machine Learning Pipeline & Baseline Rules
npm run test:ml

# Test Priority & Smart Reminder Edge Cases (including Overdue Tasks)
npm run test:reminders

# Test Document Summarization & ROUGE Benchmarks
npm run test:summarizer
```

### 2. Start ML Microservice
```bash
npm run start:ml
# Starts on http://127.0.0.1:5001
```

### 3. Start Backend Express API Server
```bash
npm run dev:server
# Starts on http://localhost:5000
```

### 4. Start Frontend React Development Server
```bash
npm run dev:client
# Starts on http://localhost:3000
```

### 5. Docker Deployment
```bash
cd ai-workspace
docker-compose up --build
```
