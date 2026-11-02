"""
Dataset Generator for Task Prioritization
Member 1: Ayantik Goswami (2360006)
Week 2 Milestone: Create synthetic task dataset and baseline priority rules.
"""

import json
import random
import os
import numpy as np
import pandas as pd

def generate_synthetic_dataset(num_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    np.random.seed(seed)
    
    categories = ['academic', 'project', 'administrative', 'personal']
    sample_titles = {
        'academic': [
            "Complete Assignment 3 for CBS3293", "Prepare Seminar 3 Presentation",
            "Study Chapter 4 for Midterm", "Submit Lab Report on Cloud Scheduling",
            "Literature review on Transformer summarization", "Review Prof. Sajal Mitra's lecture notes"
        ],
        'project': [
            "Implement Random Forest ML endpoint", "Setup Node.js Express REST API",
            "Design React Dashboard UI wireframe", "Configure Firebase Firestore collections",
            "Build Document Upload and PDF parser", "Perform integration testing on CRUD routes"
        ],
        'administrative': [
            "Fill Semester Registration Form", "Submit HITK Library clearance",
            "Pay semester tuition fee", "Upload identity proof documents",
            "Email mentor weekly progress log", "Schedule group sync meeting"
        ],
        'personal': [
            "Review personal project roadmap", "Read Research Paper on ROUGE evaluation",
            "Organize desktop workspace files", "Backup GitHub repositories to external drive",
            "Practice technical interview problems", "Weekly workout and health check"
        ]
    }
    
    records = []
    
    for i in range(num_samples):
        cat = random.choice(categories)
        base_title = random.choice(sample_titles[cat])
        title = f"{base_title} [Task #{i+1:04d}]"
        
        # Urgency & Time fields
        # Log-normal distribution to favor shorter deadlines (0.5 to 168h)
        hours_to_deadline = float(np.clip(np.random.exponential(scale=30.0) + 1.0, 1.0, 168.0))
        
        # Overdue chance (approx 8%)
        if random.random() < 0.08:
            hours_to_deadline = -float(np.random.uniform(0.5, 48.0))
            is_overdue = 1
        else:
            is_overdue = 0
            
        estimated_duration = int(random.choice([15, 30, 45, 60, 90, 120, 180, 240, 360]))
        user_importance = int(random.choices([1, 2, 3, 4, 5], weights=[0.2, 0.25, 0.3, 0.15, 0.1])[0])
        workload_pending_tasks = int(np.random.poisson(lam=5) + 1)
        workload_minutes_today = int(np.clip(workload_pending_tasks * random.choice([30, 45, 60]), 30, 600))
        
        if is_overdue:
            available_free_minutes = 0.0
        else:
            daily_free_approx = max(30, min(360, int(hours_to_deadline * 15)))
            available_free_minutes = float(np.clip(np.random.normal(daily_free_approx, 45), 0, 480))
            
        historical_completion_rate = round(float(np.clip(np.random.beta(a=7, b=2), 0.2, 1.0)), 2)
        dependency_count = int(np.random.choice([0, 1, 2, 3, 4], p=[0.5, 0.25, 0.15, 0.07, 0.03]))
        
        # Domain Rubric (Musthafa & Muthukumaran 2024):
        # 1. Urgency: exponential decay as deadline nears
        if is_overdue:
            urgency_score = 100.0
        elif hours_to_deadline <= 6:
            urgency_score = 95.0
        elif hours_to_deadline <= 18:
            urgency_score = 80.0
        elif hours_to_deadline <= 48:
            urgency_score = 55.0
        else:
            urgency_score = max(10.0, 100.0 - (hours_to_deadline / 168.0) * 90.0)
            
        # 2. Time deficit penalty (free time less than needed duration)
        time_ratio = 1.0 if estimated_duration == 0 else (available_free_minutes / estimated_duration)
        deficit_score = 0.0
        if time_ratio < 1.0:
            deficit_score = 40.0 * (1.0 - time_ratio)
        elif time_ratio < 1.5:
            deficit_score = 15.0
            
        # 3. User importance (scaled 0-100)
        importance_score = (user_importance / 5.0) * 100.0
        
        # 4. Workload congestion (0-100)
        workload_score = min(100.0, (workload_pending_tasks / 12.0) * 80.0 + (workload_minutes_today / 480.0) * 20.0)
        
        # 5. Dependency blocker impact
        dep_score = dependency_count * 20.0
        
        # Weighted Composite Score
        composite_score = (
            0.35 * urgency_score +
            0.25 * importance_score +
            0.20 * deficit_score +
            0.10 * workload_score +
            0.10 * dep_score
        )
        
        # Add slight natural variance
        composite_score += np.random.normal(0, 2.5)
        composite_score = float(np.clip(composite_score, 0.0, 100.0))
        
        # Balanced 3-class distribution:
        # High: ~25-30%
        # Medium: ~45-50%
        # Low: ~20-25%
        if composite_score >= 58.0 or is_overdue or (hours_to_deadline <= 6 and user_importance >= 3):
            label = 'high'
        elif composite_score >= 40.0 and hours_to_deadline <= 72:
            label = 'medium'
        else:
            label = 'low'
            
        records.append({
            'task_id': f"TASK-{i+1:05d}",
            'title': title,
            'category': cat,
            'hours_to_deadline': round(hours_to_deadline, 2),
            'is_overdue': is_overdue,
            'estimated_duration_min': estimated_duration,
            'user_importance': user_importance,
            'workload_pending_tasks': workload_pending_tasks,
            'workload_minutes_today': workload_minutes_today,
            'available_free_minutes': round(available_free_minutes, 1),
            'historical_completion_rate': historical_completion_rate,
            'dependency_count': dependency_count,
            'priority_score': round(composite_score, 2),
            'priority_label': label
        })
        
    df = pd.DataFrame(records)
    return df

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    print("[Member 1] Generating synthetic task dataset (5,000 samples)...")
    dataset = generate_synthetic_dataset(num_samples=5000, seed=42)
    output_path = os.path.join(data_dir, 'synthetic_tasks.csv')
    dataset.to_csv(output_path, index=False)
    
    print(f"Dataset successfully saved to: {output_path}")
    print("Class distribution:")
    print(dataset['priority_label'].value_counts())
    print("\nClass percentages:")
    print(dataset['priority_label'].value_counts(normalize=True).round(3) * 100)
