"""
Priority and Reminder Edge Case Test Suite
Member 4: Yash Raj (2360014)
Week 4 Milestone: Test task-priority and reminder cases, including missed or overdue tasks.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml', 'src'))

from smart_reminders import evaluate_smart_reminder, batch_evaluate_reminders
from baseline_rules import compute_baseline_priority
from ml_service import predict_task_priority, load_ml_models

class TestPrioritiesAndReminders(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        load_ml_models()

    def test_case_01_overdue_task_escalation(self):
        """Test that overdue tasks are marked as critical and should trigger immediately."""
        task = {
            'task_id': 'TEST-OVERDUE-01',
            'title': 'Submit Assignment 2',
            'hours_to_deadline': -5.0,
            'is_overdue': True,
            'estimated_duration_min': 60,
            'user_importance': 4
        }
        rem = evaluate_smart_reminder(task)
        self.assertEqual(rem['level'], 'critical')
        self.assertTrue(rem['should_remind_now'])
        self.assertEqual(rem['urgency_score'], 100.0)
        self.assertIn('CRITICAL', rem['message'])

    def test_case_02_imminent_deadline_time_deficit(self):
        """Test task due in 2 hours with estimated duration exceeding available free time."""
        task = {
            'task_id': 'TEST-DEFICIT-02',
            'title': 'Review Presentation with Mentor',
            'hours_to_deadline': 2.0,
            'estimated_duration_min': 90,
            'user_importance': 5
        }
        context = {
            'available_free_minutes': 30, # Less than 90 min!
            'pending_tasks_count': 6
        }
        rem = evaluate_smart_reminder(task, context)
        self.assertEqual(rem['level'], 'urgent')
        self.assertTrue(rem['should_remind_now'])
        self.assertGreaterEqual(rem['urgency_score'], 85.0)

    def test_case_03_generous_deadline_on_track(self):
        """Test task due in 5 days (120 hours) with ample free time."""
        task = {
            'task_id': 'TEST-ONTRACK-03',
            'title': 'Explore Optional Research Papers',
            'hours_to_deadline': 120.0,
            'is_overdue': False,
            'estimated_duration_min': 45,
            'user_importance': 2
        }
        context = {'available_free_minutes': 360, 'pending_tasks_count': 3}
        rem = evaluate_smart_reminder(task, context)
        self.assertEqual(rem['level'], 'info')
        self.assertFalse(rem['should_remind_now'])
        self.assertLessEqual(rem['urgency_score'], 40.0)

    def test_case_04_batch_ranking_order(self):
        """Verify that batch evaluation correctly orders reminders by urgency score."""
        tasks = [
            {'task_id': 'T1', 'title': 'Generous Deadline', 'hours_to_deadline': 72.0, 'user_importance': 1},
            {'task_id': 'T2', 'title': 'Overdue Project', 'hours_to_deadline': -2.0, 'is_overdue': True},
            {'task_id': 'T3', 'title': 'Due Today', 'hours_to_deadline': 4.0, 'user_importance': 4}
        ]
        results = batch_evaluate_reminders(tasks, {'available_free_minutes': 60})
        self.assertEqual(results[0]['task_id'], 'T2') # Overdue must be rank 1
        self.assertEqual(results[1]['task_id'], 'T3') # Imminent must be rank 2
        self.assertEqual(results[2]['task_id'], 'T1') # Generous must be rank 3

if __name__ == '__main__':
    unittest.main()
