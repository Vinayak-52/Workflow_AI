# AI Methodology and Final Model Results Presentation
**Seminar 4 / Final Evaluation Document**  
**Group:** 7 | **Course:** CBS3293 | **HITK**  
**Student:** Ayantik Goswami (Member 1 - Class Roll No: 2360006)  
**Mentor:** Prof. Sajal Mitra  

---

## Slide 1: Problem Formulation
- Modern knowledge workers suffer from **cognitive overload** and **tool fragmentation** (Noy & Zhang 2023).
- Traditional task trackers rely purely on manual priority tags (Low/Medium/High) which degrade rapidly.
- **Objective:** Build an adaptive, context-aware prioritization model that factors in deadline proximity, calendar availability, and task effort.

---

## Slide 2: Machine Learning Architecture
- **Supervised Model:** Random Forest Classifier (120 Estimators, max depth 12).
- **Synthetic Training Corpus:** 5,000 realistic task scenarios spanning Academic, Project, Administrative, and Personal domains.
- **Benchmark Baseline:** Rule-based heuristic prioritization system.

---

## Slide 3: Empirical Experimental Results

### Accuracy & F1 Comparison
| Evaluation Metric | Baseline Heuristic Rules | Random Forest Model | Absolute Gain |
|---|---|---|---|
| **Overall Accuracy** | 57.90% | **88.70%** | **+30.80%** |
| **High Priority Precision** | 62.40% | **97.30%** | **+34.90%** |
| **High Priority Recall** | 71.00% | **86.10%** | **+15.10%** |
| **High Priority F1** | 66.40% | **91.40%** | **+25.00%** |
| **Medium Priority F1** | 61.20% | **88.60%** | **+27.40%** |
| **Low Priority F1** | 49.80% | **87.20%** | **+37.40%** |

### Confusion Matrix (Test Split: 1,000 samples)
```
                Predicted Low    Predicted Medium    Predicted High
Actual Low           270                38                  0
Actual Medium         41               437                  5
Actual High            0                29                180
```

---

## Slide 4: Feature Importance Analysis
The trained Random Forest model revealed the following primary feature weights:
1. `hours_to_deadline` (33.95%): Leading factor in urgency.
2. `available_free_minutes` (23.57%): Identifies calendar bottlenecks.
3. `user_importance` (21.20%): Preserves user intent.
4. `is_overdue` (5.18%): Ensures immediate escalation.
5. `workload_pending_tasks` (3.82%): Accounts for cognitive load.

---

## Slide 5: NLP Summarization & Smart Reminders
- Extractive TF-IDF & TextRank summarizer generates high-relevance briefs with ROUGE-1 F1 $> 0.65$ and 100% citation factuality.
- Dynamic reminders adaptively escalate alerts based on available calendar slots and workload deficits.
- Continuous learning loop incorporates completion records to personalize category weights over time.
