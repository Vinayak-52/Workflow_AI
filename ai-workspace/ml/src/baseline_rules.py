"""
Baseline Priority Rules
Member 1: Ayantik Goswami (2360006)
Week 2 Milestone: Baseline priority rules and fallback prioritization logic.
"""

from typing import Dict, Any, Tuple

def compute_baseline_priority(task: Dict[str, Any]) -> Tuple[str, float, str]:
    """
    Computes priority using deterministic heuristic rules.
    Returns: (priority_label: 'low'|'medium'|'high', priority_score: 0-100, rationale: str)
    """
    hours_to_deadline = float(task.get('hours_to_deadline', 24.0))
    is_overdue = bool(task.get('is_overdue', hours_to_deadline < 0))
    user_importance = int(task.get('user_importance', 3))
    estimated_duration = int(task.get('estimated_duration_min', 60))
    available_free_minutes = float(task.get('available_free_minutes', 120.0))
    workload_pending_tasks = int(task.get('workload_pending_tasks', 5))
    dependency_count = int(task.get('dependency_count', 0))

    # Rule 1: Overdue tasks are unconditionally High Priority
    if is_overdue:
        return 'high', 98.0, "Rule: Task is overdue; immediate remediation required."

    # Rule 2: Extremely short deadline (< 6 hours) with inadequate free time
    if hours_to_deadline <= 6.0:
        return 'high', 92.0, "Rule: Imminent deadline within 6 hours."

    # Rule 3: High user importance (5/5) and deadline within 24h
    if user_importance >= 5 and hours_to_deadline <= 24.0:
        return 'high', 85.0, "Rule: Critical user importance (5/5) with deadline within 24 hours."

    # Rule 4: Time deficit (free time less than estimated task duration)
    if available_free_minutes < estimated_duration and hours_to_deadline <= 24.0:
        return 'high', 78.0, f"Rule: Time deficit ({available_free_minutes} min free vs {estimated_duration} min needed)."

    # Rule 5: Medium conditions
    if (hours_to_deadline <= 48.0) or (user_importance >= 4) or (dependency_count >= 2):
        score = 55.0 + (user_importance * 4.0) - (hours_to_deadline * 0.2)
        score = max(40.0, min(64.9, score))
        return 'medium', round(score, 1), "Rule: Moderate deadline proximity or dependent blockers."

    # Rule 6: Low priority defaults
    score = 15.0 + (user_importance * 3.0) + (min(20, workload_pending_tasks) * 0.5)
    score = max(5.0, min(37.9, score))
    return 'low', round(score, 1), "Rule: Generous deadline buffer and standard importance."

if __name__ == '__main__':
    sample = {
        'hours_to_deadline': 4.5,
        'user_importance': 4,
        'estimated_duration_min': 90,
        'available_free_minutes': 60
    }
    label, score, rationale = compute_baseline_priority(sample)
    print(f"Sample test -> Label: {label}, Score: {score}, Rationale: {rationale}")
