import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

def train_priority_model():
    data_path = 'data/synthetic_tasks.csv'
    if not os.path.exists(data_path):
        from generate_dataset import generate_synthetic_tasks
        generate_synthetic_tasks()

    df = pd.read_csv(data_path)
    feature_cols = [
        'hours_until_deadline',
        'duration_minutes',
        'user_importance',
        'available_free_mins',
        'other_tasks_due',
        'workload_score'
    ]

    X = df[feature_cols]
    y = df['priority']

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Train Random Forest Classifier
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=5,
        random_state=42
    )
    rf.fit(X_train, y_train)

    # Predictions
    y_pred = rf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    cm = confusion_matrix(y_test, y_pred, labels=['low', 'medium', 'high']).tolist()

    # Baseline rule comparison (hours <= 24 -> high, <= 72 -> medium, else low)
    baseline_preds = []
    for h in X_test['hours_until_deadline']:
        if h <= 24.0:
            baseline_preds.append('high')
        elif h <= 72.0:
            baseline_preds.append('medium')
        else:
            baseline_preds.append('low')
    baseline_acc = accuracy_score(y_test, baseline_preds)

    os.makedirs('models', exist_ok=True)
    joblib.dump(rf, 'models/task_priority_rf.joblib')

    metrics = {
        'model': 'RandomForestClassifier',
        'n_estimators': 100,
        'features': feature_cols,
        'test_accuracy': round(accuracy, 4),
        'baseline_accuracy': round(baseline_acc, 4),
        'accuracy_delta': round(accuracy - baseline_acc, 4),
        'confusion_matrix_labels': ['low', 'medium', 'high'],
        'confusion_matrix': cm,
        'feature_importances': dict(zip(feature_cols, [round(float(v), 4) for v in rf.feature_importances_])),
        'classification_report': report
    }

    with open('models/model_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"Random Forest Training Complete!")
    print(f"Model Test Accuracy: {accuracy*100:.2f}% (vs Baseline: {baseline_acc*100:.2f}%)")
    print("Saved model to models/task_priority_rf.joblib and metrics to models/model_metrics.json")

if __name__ == '__main__':
    train_priority_model()
