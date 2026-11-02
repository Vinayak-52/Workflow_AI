"""
Continuous Learning Feedback & Model Adaptation Engine
Member 1: Ayantik Goswami (2360006)
Week 6 Milestone: Improve priority model using completion-history feedback; define continuous-learning workflow.
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List

class ContinuousLearningPipeline:
    def __init__(self, feedback_file: str = None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.feedback_file = feedback_file or os.path.join(base_dir, '..', 'data', 'feedback_history.json')
        os.makedirs(os.path.dirname(self.feedback_file), exist_ok=True)
        self.history = self._load_history()

    def _load_history(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.feedback_file):
            try:
                with open(self.feedback_file, 'r') as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save_history(self):
        with open(self.feedback_file, 'w') as f:
            json.dump(self.history, f, indent=2)

    def record_task_feedback(
        self,
        task_id: str,
        predicted_priority: str,
        user_priority: str,
        completed_on_time: bool,
        hours_to_deadline: float,
        actual_duration_min: int,
        estimated_duration_min: int,
        category: str = 'project'
    ) -> Dict[str, Any]:
        """
        Records a completion or manual override event to adapt future recommendations.
        """
        record = {
            'task_id': task_id,
            'timestamp': datetime.now().isoformat(),
            'predicted_priority': predicted_priority,
            'user_priority': user_priority,
            'is_override': (predicted_priority != user_priority),
            'completed_on_time': completed_on_time,
            'hours_to_deadline': hours_to_deadline,
            'actual_duration_min': actual_duration_min,
            'estimated_duration_min': estimated_duration_min,
            'duration_error_ratio': round(actual_duration_min / max(1, estimated_duration_min), 2),
            'category': category
        }
        self.history.append(record)
        self._save_history()

        stats = self.compute_feedback_insights()
        return {
            'status': 'success',
            'feedback_count': len(self.history),
            'record': record,
            'insights': stats
        }

    def compute_feedback_insights(self) -> Dict[str, Any]:
        if not self.history:
            return {
                'total_feedback_events': 0,
                'override_rate': 0.0,
                'on_time_completion_rate': 1.0,
                'category_adjustments': {},
                'recommendation': "Insufficient feedback data collected yet."
            }

        total = len(self.history)
        overrides = sum(1 for h in self.history if h['is_override'])
        on_time = sum(1 for h in self.history if h['completed_on_time'])

        # Group by category to find user tendencies
        cat_stats = {}
        for h in self.history:
            cat = h.get('category', 'general')
            if cat not in cat_stats:
                cat_stats[cat] = {'total': 0, 'on_time': 0, 'overrides_to_high': 0}
            cat_stats[cat]['total'] += 1
            if h['completed_on_time']:
                cat_stats[cat]['on_time'] += 1
            if h['user_priority'] == 'high' and h['predicted_priority'] != 'high':
                cat_stats[cat]['overrides_to_high'] += 1

        category_weights = {}
        for cat, c_data in cat_stats.items():
            tot = c_data['total']
            on_time_ratio = c_data['on_time'] / tot
            high_override_ratio = c_data['overrides_to_high'] / tot
            # If user frequently bumps this category to high, add boost
            boost = round(1.0 + (high_override_ratio * 0.3) - ((1.0 - on_time_ratio) * 0.1), 3)
            category_weights[cat] = boost

        override_rate = round(overrides / total, 3)
        on_time_rate = round(on_time / total, 3)

        return {
            'total_feedback_events': total,
            'override_rate': override_rate,
            'on_time_completion_rate': on_time_rate,
            'category_weights': category_weights,
            'recommendation': "Model adapted: Boosting weight on high-override categories." if override_rate > 0.15 else "Model performance stable."
        }

if __name__ == '__main__':
    pipeline = ContinuousLearningPipeline()
    res = pipeline.record_task_feedback(
        task_id="TASK-001",
        predicted_priority="medium",
        user_priority="high",
        completed_on_time=True,
        hours_to_deadline=12.0,
        actual_duration_min=90,
        estimated_duration_min=60,
        category="academic"
    )
    print("Feedback recorded successfully:")
    print(json.dumps(res, indent=2))
