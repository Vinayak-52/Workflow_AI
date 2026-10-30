import sys
import json
import os
import joblib
import pandas as pd

def baseline_predict(hours, importance):
    if hours <= 24.0 or importance >= 4:
        return 'high', 0.88
    elif hours <= 72.0 or importance >= 3:
        return 'medium', 0.60
    else:
        return 'low', 0.35

def main():
    try:
        input_data = json.loads(sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read())
    except Exception:
        input_data = {
            'hours_until_deadline': 20.0,
            'duration_minutes': 45,
            'user_importance': 3,
            'available_free_mins': 60.0,
            'other_tasks_due': 2,
            'workload_score': 0.4
        }

    hours = float(input_data.get('hours_until_deadline', 48.0))
    duration = int(input_data.get('duration_minutes', 30))
    importance = int(input_data.get('user_importance', 3))
    free_mins = float(input_data.get('available_free_mins', 120.0))
    other_due = int(input_data.get('other_tasks_due', 1))
    workload = float(input_data.get('workload_score', 0.3))

    model_path = os.path.join(os.path.dirname(__file__), '../models/task_priority_rf.joblib')

    if os.path.exists(model_path):
        try:
            model = joblib.load(model_path)
            row = pd.DataFrame([{
                'hours_until_deadline': hours,
                'duration_minutes': duration,
                'user_importance': importance,
                'available_free_mins': free_mins,
                'other_tasks_due': other_due,
                'workload_score': workload
            }])
            pred = model.predict(row)[0]
            probs = model.predict_proba(row)[0]
            class_idx = list(model.classes_).index(pred)
            score = round(float(probs[class_idx]), 3)

            output = {
                'priority': pred,
                'score': score,
                'engine': 'random_forest_ml',
                'modelVersion': 'rf-v1.0'
            }
            print(json.dumps(output))
            return
        except Exception as e:
            pass

    # Fallback baseline rules
    pred, score = baseline_predict(hours, importance)
    print(json.dumps({
        'priority': pred,
        'score': score,
        'engine': 'baseline_rules_fallback',
        'modelVersion': 'baseline-rule-v1'
    }))

if __name__ == '__main__':
    main()
