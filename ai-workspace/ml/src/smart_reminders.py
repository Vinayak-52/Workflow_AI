"""
Smart Reminder Evaluation Engine
Member 1: Ayantik Goswami (2360006)
Week 4 Milestone: Design smart-reminder logic using urgency, deadlines, workload, and available time.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

def evaluate_smart_reminder(task: Dict[str, Any], user_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Evaluates smart reminder recommendation based on:
    - Task urgency & deadline proximity
    - Estimated duration vs. calendar free time
    - Current workload (pending tasks, hours today)
    - Overdue status & historical completion risk
    """
    user_context = user_context or {}
    
    hours_to_deadline = float(task.get('hours_to_deadline', 24.0))
    is_overdue = bool(task.get('is_overdue', hours_to_deadline < 0))
    estimated_duration_min = int(task.get('estimated_duration_min', 60))
    user_importance = int(task.get('user_importance', 3))
    
    # Contextual factors
    available_free_minutes = float(user_context.get('available_free_minutes', task.get('available_free_minutes', 120.0)))
    pending_tasks_count = int(user_context.get('pending_tasks_count', 4))
    scheduled_meetings_today = int(user_context.get('scheduled_meetings_today', 2))
    
    # 1. Imminent / Overdue evaluation
    if is_overdue:
        return {
            'level': 'critical',
            'action_required': 'Immediate Action / Reschedule',
            'should_remind_now': True,
            'message': f"CRITICAL: '{task.get('title', 'Task')}' is overdue by {abs(hours_to_deadline):.1f} hours! Review or reschedule immediately.",
            'urgency_score': 100.0,
            'suggested_slot_min': min(30, estimated_duration_min),
            'factors': {
                'overdue': True,
                'hours_overdue': abs(hours_to_deadline),
                'risk_level': 'High'
            }
        }
        
    # 2. Time Deficit evaluation
    # If time needed exceeds 80% of total available free time before deadline
    time_deficit_risk = estimated_duration_min > (available_free_minutes * 0.8)
    
    if hours_to_deadline <= 3.0:
        return {
            'level': 'urgent',
            'action_required': 'Start Task Now',
            'should_remind_now': True,
            'message': f"URGENT: Only {hours_to_deadline:.1f} hours remaining for '{task.get('title', 'Task')}'. You have ~{available_free_minutes} min free time.",
            'urgency_score': 95.0,
            'suggested_slot_min': estimated_duration_min,
            'factors': {
                'hours_remaining': hours_to_deadline,
                'time_deficit': time_deficit_risk,
                'workload_pressure': 'High'
            }
        }
    elif hours_to_deadline <= 12.0 and time_deficit_risk:
        return {
            'level': 'urgent',
            'action_required': 'Block Focus Time',
            'should_remind_now': True,
            'message': f"High Workload Alert: '{task.get('title', 'Task')}' requires {estimated_duration_min} min, but only {available_free_minutes} min are unbooked before deadline.",
            'urgency_score': 85.0,
            'suggested_slot_min': estimated_duration_min,
            'factors': {
                'hours_remaining': hours_to_deadline,
                'time_deficit': True,
                'pending_tasks': pending_tasks_count
            }
        }
    elif hours_to_deadline <= 24.0 or user_importance >= 4:
        return {
            'level': 'warning',
            'action_required': 'Plan Today',
            'should_remind_now': hours_to_deadline <= 8.0,
            'message': f"Upcoming: '{task.get('title', 'Task')}' is due in {hours_to_deadline:.1f} hours. Reserve a focus block today.",
            'urgency_score': 65.0,
            'suggested_slot_min': estimated_duration_min,
            'factors': {
                'hours_remaining': hours_to_deadline,
                'user_importance': user_importance,
                'time_deficit': time_deficit_risk
            }
        }
    else:
        # Standard notification scheduling
        # Calculate optimal advance reminder time (e.g. 24h prior, or when free window opens)
        lead_time_hours = max(2.0, min(24.0, hours_to_deadline * 0.25))
        return {
            'level': 'info',
            'action_required': 'On Track',
            'should_remind_now': False,
            'message': f"On Schedule: '{task.get('title', 'Task')}' due in {hours_to_deadline:.1f}h. Reminder queued for {lead_time_hours:.1f}h before deadline.",
            'urgency_score': 30.0,
            'suggested_slot_min': estimated_duration_min,
            'factors': {
                'hours_remaining': hours_to_deadline,
                'available_buffer': available_free_minutes - estimated_duration_min
            }
        }

def batch_evaluate_reminders(tasks: List[Dict[str, Any]], user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Ranks reminders across all active user tasks and flags top actionable alerts.
    """
    results = []
    for t in tasks:
        eval_res = evaluate_smart_reminder(t, user_context)
        results.append({
            'task_id': t.get('task_id', t.get('id')),
            'title': t.get('title'),
            **eval_res
        })
    # Sort by urgency score descending
    results.sort(key=lambda x: x['urgency_score'], reverse=True)
    return results

if __name__ == '__main__':
    sample_task = {
        'task_id': 'TASK-001',
        'title': 'Submit Term Paper to Prof. Sajal Mitra',
        'hours_to_deadline': 2.5,
        'estimated_duration_min': 90,
        'user_importance': 5
    }
    sample_context = {
        'available_free_minutes': 60,
        'pending_tasks_count': 7
    }
    res = evaluate_smart_reminder(sample_task, sample_context)
    print("Smart Reminder Test Result:")
    import pprint
    pprint.pprint(res)
