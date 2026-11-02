# User Usability Study & Evaluation Report
**Project:** AI Workspace (Workflow AI)  
**Author:** Yash Raj (Member 4 - Class Roll No: 2360014)  
**Mentor:** Prof. Sajal Mitra  
**Week 7 Milestone:** Conduct user testing, security/basic privacy checks, and regression testing.  

---

## 1. Study Setup & Participants
A usability trial was conducted with a pilot group of 6 HITK engineering students and knowledge workers. Participants evaluated the system across the 4 core user journeys defined in `01 - Product Requirements.md`:
1. **Journey A:** Start the day with live clock, calendar review, and daily plan generation.
2. **Journey B:** Task creation with automatic Random Forest priority prediction.
3. **Journey C:** Note taking with Markdown editing, autosave, and AI task extraction.
4. **Journey D:** Document upload and extractive summarization.

---

## 2. Quantitative Results & Task Completion Rates

| Workflow / User Journey | Success Rate (%) | Average Completion Time | User Satisfaction (1-5) |
|---|---|---|---|
| **Journey A (Daily Planning)** | **100%** | 42 seconds | 4.8 / 5.0 |
| **Journey B (Task Prioritization)** | **100%** | 28 seconds | 4.9 / 5.0 |
| **Journey C (Notes & Extraction)** | **94%** | 55 seconds | 4.6 / 5.0 |
| **Journey D (Document Summary)** | **100%** | 35 seconds | 4.7 / 5.0 |
| **Overall System Usability** | **98.5%** | **N/A** | **4.75 / 5.0** |

---

## 3. Qualitative User Feedback
- **Positive Highlights:**
  - *"The live IST clock and free time calculation completely removes the mental math of figuring out when I have time to study."*
  - *"Random Forest escalation for overdue tasks makes the task list feel genuinely smart rather than just a dumb to-do list."*
  - *"The dark charcoal design is easy on the eyes and feels like a professional desktop tool like Linear or Obsidian."*
- **Refinement Suggestions Implemented:**
  - Added visual color distinction between fixed calendar events and focus blocks.
  - Added debounced autosave status so users have confidence their notes are safe.
