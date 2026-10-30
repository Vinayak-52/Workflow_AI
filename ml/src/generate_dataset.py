import os
import random
import pandas as pd
import numpy as np

def generate_synthetic_tasks(n_samples=2500, random_seed=42):
    random.seed(random_seed)
    np.random.seed(random_seed)

    data = []

    for _ in range(n_samples):
        # Time remaining until deadline (hours)
        hours_until_deadline = round(np.random.exponential(scale=36.0) + 1.0, 1)
        if hours_until_deadline > 168.0:
            hours_until_deadline = 168.0

        # Estimated task duration (minutes)
        duration_minutes = random.choice([15, 30, 45, 60, 90, 120, 180])

        # User stated importance (1 to 5)
        user_importance = random.choices([1, 2, 3, 4, 5], weights=[0.1, 0.2, 0.4, 0.2, 0.1])[0]

        # Available free minutes before deadline
        available_free_ratio = np.random.uniform(0.3, 1.5)
        available_free_mins = max(15.0, round(hours_until_deadline * 60 * available_free_ratio, 1))

        # Concurrent tasks due soon
        other_tasks_due = random.randint(0, 8)

        # Workload score (0.0 to 1.0)
        workload_score = round(min(1.0, (other_tasks_due * 0.1) + (duration_minutes / 300.0)), 2)

        # Ground truth priority assignment based on academic rubric
        # Urgency: duration vs free time and absolute deadline
        urgency_factor = duration_minutes / (available_free_mins + 1e-5)

        if hours_until_deadline <= 24.0 or urgency_factor >= 0.7 or (user_importance >= 4 and hours_until_deadline <= 48):
            label = 'high'
        elif hours_until_deadline <= 72.0 or user_importance >= 3:
            label = 'medium'
        else:
            label = 'low'

        # Introduce small natural noise (5%) to simulate realistic human variation
        if random.random() < 0.05:
            label = random.choice(['low', 'medium', 'high'])

        data.append({
            'hours_until_deadline': hours_until_deadline,
            'duration_minutes': duration_minutes,
            'user_importance': user_importance,
            'available_free_mins': available_free_mins,
            'other_tasks_due': other_tasks_due,
            'workload_score': workload_score,
            'priority': label
        })

    df = pd.DataFrame(data)
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/synthetic_tasks.csv', index=False)
    print(f"Generated {n_samples} synthetic task records in data/synthetic_tasks.csv")
    print(df['priority'].value_counts())

if __name__ == '__main__':
    generate_synthetic_tasks()
