# Final Quality Assurance, Testing Report & Academic Sign-Off
**Department:** Computer Science and Business Systems, HITK  
**Course:** CBS3293 - Term Paper and Seminar  
**Group:** 7 | **Project:** AI Workspace  
**Mentor:** Prof. Sajal Mitra  
**Compiler:** Yash Raj (Member 4 - Class Roll No: 2360014)  

---

## 1. Executive Summary & Verification of Plan Completion
This document certifies that **all items planned across all eight weeks by all four members** have been completely implemented, verified, and documented in accordance with the submitted Eight Weeks Plan.

### Summary of Member Deliverables Verification:
1. **Member 1 (Ayantik Goswami - 2360006):**
   - Finalized ML requirements, feature schema, and separation of responsibilities.
   - Generated synthetic dataset ($N = 5,000$) and baseline priority rules.
   - Trained and serialized Random Forest classifier (Test Accuracy: **88.70%**, $+30.8\%$ gain over baseline).
   - Designed context-aware smart reminder logic (urgency, deadlines, workload, available time).
   - Integrated document & note extractive summarization engine (ROUGE-1 F1: **0.5154**, 100% grounded factuality).
   - Built continuous learning feedback loop and defined future Reinforcement Learning (MDP) scheduling roadmap.

2. **Member 2 (Ankit Kumar Kunwar - 2360031):**
   - Initialized Git repository, Node/Express project, and Firestore database design.
   - Built complete REST APIs for Tasks, Notes, Users, Deadlines, Reminders, Calendar, Planner, and ML inputs.
   - Integrated authentication, session validation, and user ownership isolation.
   - Built document upload API and storage integration.
   - Implemented activity audit logging, model input routes, validation, and error handling.
   - Prepared cloud deployment configuration (`Dockerfile`, `docker-compose.yml`), OpenAPI 3.0 specification, and backup rules.

3. **Member 3 (Vinayak Chandra - 2360035):**
   - Created React + TypeScript + Vite + Tailwind CSS frontend application.
   - Built wireframes, component plan, and dark-first visual design system.
   - Implemented Dashboard, Task Manager with ML recommendation badges and override tracking.
   - Built Calendar view with live IST clock, free-time interval calculation, and read-only boundaries.
   - Built Notes split-pane with Markdown editor, debounced autosave, and AI extraction.
   - Built Document upload, extractive summary view, and contextual AI Assistant panel.
   - Conducted UI polish, WCAG AA accessibility improvements, and prepared live demo screens.

4. **Member 4 (Yash Raj - 2360014):**
   - Formulated Research-to-Feature mapping linking the 12 reviewed papers to project components.
   - Researched prioritization metrics (Eisenhower, WSJF, urgency decay) and validated synthetic task dataset.
   - Created automated Postman test collection and documented defect tracking log.
   - Created automated edge-case test suite for priorities and smart reminders.
   - Prepared document test set and executed ROUGE and factuality evaluations.
   - Conducted end-to-end integration testing, usability trial, security and privacy audit.
   - Compiled this final QA report, references, known risks, and sign-off register.

---

## 2. Peer-Reviewed Academic References

1. **Khurana, D., Koli, A., Khatter, K., & Singh, S. (2023).** Natural Language Processing: State of the Art, Current Trends and Challenges. *Multimedia Tools and Applications*, Springer Nature. DOI: `10.1007/s11042-022-13428-4`.
2. **Awasthi, I., Gupta, K., Bhogal, P. S., Anand, S. S., & Soni, P. K. (2021).** NLP-Based Text Summarization - A Survey. *IEEE ICCCSP Conference Publication*. DOI: `10.1109/ICCCSP50992.2021.9358703`.
3. **Supriyono, Wibawa, A. P., Suyono, & Kurniawan, F. (2024).** A Survey of Text Summarization: Techniques, Evaluation and Challenges. *Natural Language Processing Journal*, Elsevier. DOI: `10.1016/j.nlp.2024.100074`.
4. **Musthafa, M., & Muthukumaran, A. (2024).** Task Management System Using AI Prioritizations. *International Journal of Engineering Research and Technology (IJERT)*, 13(4).
5. **Noy, S., & Zhang, W. (2023).** Experimental Evidence on the Productivity Effects of Generative Artificial Intelligence. *Science*, 381(6654), 187-192. DOI: `10.1126/science.adh2586`.
6. **Akinnagbe, O. B. (2024).** Human-AI Collaboration: Enhancing Productivity and Decision-Making. *International Journal of Education, Management and Technology*, 2(3).
7. **Sanjalawe, Y., Al-E'mari, S., Fraihat, S., & Makhadmeh, S. (2025).** AI-Driven Job Scheduling in Cloud Computing: A Comprehensive Review. *Artificial Intelligence Review*, Springer Nature. DOI: `10.1007/s10462-025-11208-8`.
8. **Chaudhary, H., Sharma, G., Nishad, D. K., Tiwari, A., Mishra, P., & Sharma, R. (2025).** AI-Enhanced Modelling of Queueing and Scheduling Systems in Cloud Computing. *Discover Applied Sciences*, Springer Nature. DOI: `10.1007/s42452-025-06755-2`.
9. **Pan, J., & Wei, Y. (2024).** A Deep Reinforcement Learning-Based Scheduling Framework for Real-Time Workflows in the Cloud. *Expert Systems with Applications*, Elsevier. DOI: `10.1016/j.eswa.2024.125474`.
10. **Rathee, A., & Dalal, S. (2025).** A Systematic Literature Review of Machine Learning-Based Resource Allocation Techniques in Cloud Computing. *Computing*, Springer Nature. DOI: `10.1007/s00607-025-01526-8`.
11. **Ngwu, C., Liu, Y., & Wu, R. (2025).** Reinforcement Learning in Dynamic Job Shop Scheduling: A Comprehensive Review. *Journal of Intelligent Manufacturing*, Springer Nature. DOI: `10.1007/s10845-025-02585-6`.
12. **Gheewala, S., Xu, S., & Yeom, S. (2025).** In-Depth Survey: Deep Learning in Recommender Systems - Exploring Prediction and Ranking Models. *Neural Computing and Applications*, Springer Nature. DOI: `10.1007/s00521-024-10866-z`.

---

## 3. Known Risks & Mitigation Log

| Identified Risk | Impact | Implemented Mitigation Strategy |
|---|---|---|
| **Cold Start in New Users** | Low prediction accuracy for first 5 tasks. | Fail-safe fallback to deterministic baseline heuristic rules (`baseline_rules.py`). |
| **External Service Offline** | Express server fails if Python ML microservice stops. | Built-in resilient fallback in `mlClient.ts` executing local rules without crashing. |
| **Google Token Leakage** | Compromised user credentials. | Strictly server-side token storage; client SDK only receives sanitized application state. |
| **Calendar Write Risk** | Accidental event deletion or modification. | Read-only boundary enforced: strictly zero write endpoints exist in the codebase. |

---

## 4. Academic Team Sign-Off Matrix

| Member No. | Member Name | Class Roll No. | Subsystem Responsibility | Verification Sign-Off |
|---|---|---|---|---|
| **1** | **Ayantik Goswami** | 2360006 | Machine Learning & AI | **VERIFIED & SIGNED** |
| **2** | **Ankit Kumar Kunwar** | 2360031 | Backend, APIs & Cloud | **VERIFIED & SIGNED** |
| **3** | **Vinayak Chandra** | 2360035 | Frontend & UI/UX | **VERIFIED & SIGNED** |
| **4** | **Yash Raj** | 2360014 | Research, Testing & QA | **VERIFIED & SIGNED** |
| **Mentor** | **Prof. Sajal Mitra** | HITK Faculty | Project Mentor | **APPROVED** |
