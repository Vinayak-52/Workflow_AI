# AI and Machine Learning Model Specification & Architecture
**Project:** AI Workspace (Workflow AI)  
**Department:** Department of Computer Science and Business Systems, HITK  
**Mentor:** Prof. Sajal Mitra  
**Author:** Ayantik Goswami (Member 1 - Class Roll No: 2360006)  

---

## 1. Executive Summary & Separation of Responsibilities
The AI Workspace architecture implements a rigorous separation of responsibilities between classical deterministic logic, supervised machine learning, and natural language processing:
1. **Machine Learning Layer (Random Forest Classifier):** Learns multi-factor non-linear priority ranking from task attributes (deadline proximity, time deficit, user importance, workload).
2. **Deterministic Rules Engine:** Serves as a baseline benchmark and a fail-safe fallback when data is unavailable or edge cases (such as overdue status) occur.
3. **Natural Language Processing (NLP Engine):** Extracts candidate tasks, dates, and summaries from accumulated notes and uploaded documents without hallucinating deadlines or altering external calendar commitments.
4. **Deterministic Planner:** Calculates exact calendar free/busy blocks and fits ranked tasks into available intervals.

---

## 2. Feature Schema & Data Fields

The task prioritization model utilizes 13 engineered features:

| Feature Name | Type | Description | Range / Values | Importance (%) |
|---|---|---|---|---|
| `hours_to_deadline` | Float | Wall-clock hours remaining until deadline | $-48.0$ to $168.0$ | **33.95%** |
| `available_free_minutes` | Float | Unbooked calendar minutes before deadline | $0.0$ to $480.0$ | **23.57%** |
| `user_importance` | Integer | User-assigned importance rating | $1$ (Lowest) to $5$ (Highest) | **21.20%** |
| `is_overdue` | Binary | Whether current timestamp > deadline | $0$ or $1$ | **5.18%** |
| `historical_completion_rate` | Float | Completion rate for this task category | $0.20$ to $1.00$ | **3.24%** |
| `workload_pending_tasks` | Integer | Total active pending tasks for the user | $1$ to $25$ | **3.82%** |
| `workload_minutes_today` | Integer | Aggregate duration of tasks due today | $30$ to $600$ | **2.50%** |
| `dependency_count` | Integer | Number of blocker tasks required | $0$ to $4$ | **3.69%** |
| `estimated_duration_min` | Integer | Expected time needed to complete task | $15$ to $360$ minutes | **2.85%** |
| `cat_academic` | Binary | Task category one-hot indicator | $0$ or $1$ | **0.80%** |
| `cat_administrative` | Binary | Task category one-hot indicator | $0$ or $1$ | **0.75%** |
| `cat_personal` | Binary | Task category one-hot indicator | $0$ or $1$ | **0.65%** |
| `cat_project` | Binary | Task category one-hot indicator | $0$ or $1$ | **0.80%** |

---

## 3. Model Architecture & Hyperparameters
- **Algorithm:** `RandomForestClassifier` (`scikit-learn` v1.8.0)
- **Number of Estimators ($N$):** 120 decision trees
- **Max Depth:** 12
- **Splitting Criterion:** Gini impurity
- **Minimum Samples Split:** 4
- **Class Weighting:** `balanced` (mitigates distribution skews)
- **Feature Preprocessing:** `StandardScaler` normalization

### Comparative Performance vs. Baseline Rules
- **Random Forest Test Accuracy:** **88.70%**
- **Baseline Heuristic Accuracy:** **57.90%**
- **Performance Advantage:** **+30.80% accuracy improvement**
- **High-Priority Precision:** **97.3%**
- **High-Priority F1-Score:** **91.4%**

---

## 4. Smart Reminders Formulation
The context-aware reminder engine calculates a dynamic composite urgency index ($U$):

$$U = w_1 \cdot \text{Decay}(\Delta t_{\text{deadline}}) + w_2 \cdot \text{Deficit}(T_{\text{estimated}}, T_{\text{free}}) + w_3 \cdot I_{\text{user}} + w_4 \cdot W_{\text{load}}$$

Where:
- $\text{Decay}(\Delta t)$ accelerates exponentially as $\Delta t \to 0$ or becomes negative (overdue).
- $\text{Deficit} = \max(0, T_{\text{estimated}} - 0.8 \cdot T_{\text{free}})$.
- Alerts trigger into 4 distinct tiers: `info`, `warning`, `urgent`, `critical`.

---

## 5. Model Limitations
1. **Cold Start:** New users without historical completion records default to baseline rules until 5+ task outcomes are recorded.
2. **Calendar Visibility:** Available free-time calculations assume Google Calendar accurately reflects all personal commitments.
3. **Synthetic Training Distribution:** Initial weights are tuned on synthetic datasets simulating academic and project workloads. Continuous learning feedback is essential to adapt to unique user behavioral patterns.

---

## 6. Future Reinforcement Learning (RL) Enhancement Roadmap
As outlined in the submitted academic plan, the system architecture provides an explicit extension path from static classification to Deep Reinforcement Learning for dynamic workflow scheduling (Pan & Wei 2024, Ngwu et al. 2025):

### Markov Decision Process (MDP) Formulation
- **State Space $S_t$:** Current time $t$, list of uncompleted tasks $\{T_i\}$, remaining durations, deadlines, user energy/circadian profile, and calendar busy intervals.
- **Action Space $A_t$:** Assign task $T_i$ to time slot $[t_s, t_e]$, insert rest break, or defer task.
- **Reward Function $R(s, a)$:**
  $$R = +R_{\text{on\_time}} - \lambda_1 \cdot P_{\text{overdue}} - \lambda_2 \cdot C_{\text{context\_switch}} - \lambda_3 \cdot D_{\text{cognitive\_fatigue}}$$
- **Target Policy:** Proximal Policy Optimization (PPO) or Deep Q-Network (DQN) trained in a simulated multi-week calendar environment.
