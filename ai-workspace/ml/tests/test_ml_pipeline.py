"""
Automated Test Suite for AI/ML Processing Pipeline
Member 1 (Ayantik Goswami) & Member 4 (Yash Raj)
Weeks 2-6 Verification
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from baseline_rules import compute_baseline_priority
from smart_reminders import evaluate_smart_reminder, batch_evaluate_reminders
from summarizer import DocumentSummarizer
from continuous_learning import ContinuousLearningPipeline
from ml_service import predict_task_priority, load_ml_models

class TestMLPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        load_ml_models()

    def test_01_baseline_overdue_rule(self):
        task = {'is_overdue': True, 'hours_to_deadline': -4.0}
        label, score, rationale = compute_baseline_priority(task)
        self.assertEqual(label, 'high')
        self.assertGreaterEqual(score, 90.0)

    def test_02_baseline_generous_deadline(self):
        task = {'hours_to_deadline': 120.0, 'user_importance': 1, 'estimated_duration_min': 30}
        label, score, rationale = compute_baseline_priority(task)
        self.assertEqual(label, 'low')
        self.assertLessEqual(score, 40.0)

    def test_03_random_forest_prediction(self):
        task = {
            'hours_to_deadline': 3.5,
            'is_overdue': 0,
            'estimated_duration_min': 120,
            'user_importance': 5,
            'workload_pending_tasks': 8,
            'workload_minutes_today': 360,
            'available_free_minutes': 45.0,
            'historical_completion_rate': 0.8,
            'dependency_count': 2,
            'category': 'academic'
        }
        res = predict_task_priority(task)
        self.assertIn(res['predicted_priority'], ['low', 'medium', 'high'])
        self.assertEqual(res['predicted_priority'], 'high')
        self.assertGreaterEqual(res['priority_score'], 60.0)
        self.assertIn('method', res)

    def test_04_smart_reminder_urgency(self):
        task = {
            'title': 'Final Lab Submission',
            'hours_to_deadline': 2.0,
            'estimated_duration_min': 90,
            'user_importance': 5
        }
        context = {'available_free_minutes': 60, 'pending_tasks_count': 5}
        rem = evaluate_smart_reminder(task, context)
        self.assertEqual(rem['level'], 'urgent')
        self.assertTrue(rem['should_remind_now'])

    def test_05_summarization_and_rouge(self):
        text = """
        Artificial Intelligence and Machine Learning are transforming modern cloud architectures.
        Workflow AI integrates task management, NLP document summarization, and machine learning prioritization.
        Students and knowledge workers benefit significantly from automated daily schedule planning.
        Teams can synchronize their activities seamlessly across web and mobile platforms.
        Users must upload their seminar documentation prior to the final review meeting.
        """
        summarizer = DocumentSummarizer()
        summary_res = summarizer.summarize_extractive(text, max_sentences=2)
        self.assertIsNotNone(summary_res['summary'])
        self.assertGreater(len(summary_res['summary']), 20)
        self.assertGreater(len(summary_res['key_takeaways']), 0)
        
        # Test ROUGE evaluation
        rouge = summarizer.compute_rouge_scores(text, summary_res['summary'])
        self.assertGreater(rouge['rouge1_f1'], 0.0)
        self.assertGreater(rouge['rougeL_f1'], 0.0)

    def test_06_continuous_learning_feedback(self):
        learner = ContinuousLearningPipeline()
        feedback = learner.record_task_feedback(
            task_id="TASK-TEST-99",
            predicted_priority="medium",
            user_priority="high",
            completed_on_time=True,
            hours_to_deadline=8.0,
            actual_duration_min=75,
            estimated_duration_min=60,
            category="project"
        )
        self.assertEqual(feedback['status'], 'success')
        self.assertIn('insights', feedback)

if __name__ == '__main__':
    unittest.main()
