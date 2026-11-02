"""
Train Random Forest Task-Prioritization Model
Member 1: Ayantik Goswami (2360006)
Week 3 Milestone: Train and evaluate initial Random Forest task-prioritization model.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from baseline_rules import compute_baseline_priority

def train_and_evaluate():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, '..', 'data', 'synthetic_tasks.csv')
    models_dir = os.path.join(base_dir, '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    if not os.path.exists(data_path):
        from dataset_generator import generate_synthetic_dataset
        print("Dataset not found. Generating...")
        df = generate_synthetic_dataset(num_samples=5000, seed=42)
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)
        
    print(f"Loaded dataset: {len(df)} samples")
    
    # Feature columns
    feature_cols = [
        'hours_to_deadline',
        'is_overdue',
        'estimated_duration_min',
        'user_importance',
        'workload_pending_tasks',
        'workload_minutes_today',
        'available_free_minutes',
        'historical_completion_rate',
        'dependency_count'
    ]
    
    # Category one-hot encoding
    df_encoded = pd.get_dummies(df, columns=['category'], prefix='cat', drop_first=False)
    cat_cols = [c for c in df_encoded.columns if c.startswith('cat_')]
    all_features = feature_cols + cat_cols
    
    X = df_encoded[all_features].values
    y = df_encoded['priority_label'].values
    
    # Train / Test split 80/20 with stratification
    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, df_encoded.index, test_size=0.20, random_state=42, stratify=y
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Random Forest Classifier
    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    
    print("Training Random Forest model...")
    rf.fit(X_train_scaled, y_train)
    
    y_pred = rf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    cm = confusion_matrix(y_test, y_pred, labels=['low', 'medium', 'high'])
    
    # Evaluate Baseline rules on the exact same test split for comparison
    test_rows = df.loc[idx_test]
    baseline_preds = []
    for _, row in test_rows.iterrows():
        b_label, _, _ = compute_baseline_priority(row.to_dict())
        baseline_preds.append(b_label)
        
    base_acc = accuracy_score(y_test, baseline_preds)
    base_report = classification_report(y_test, baseline_preds, output_dict=True)
    
    # Feature importances
    importances = dict(zip(all_features, rf.feature_importances_.round(4)))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)
    
    print(f"\n==========================================")
    print(f"Model Training Results [Random Forest]")
    print(f"==========================================")
    print(f"Random Forest Test Accuracy: {acc * 100:.2f}%")
    print(f"Baseline Rules Test Accuracy: {base_acc * 100:.2f}%")
    print(f"Performance Gain over Baseline: +{(acc - base_acc) * 100:.2f}%")
    print("\nClassification Report (Random Forest):")
    for cls in ['low', 'medium', 'high']:
        metrics = report[cls]
        print(f"  Class '{cls.upper()}': Precision={metrics['precision']:.3f}, Recall={metrics['recall']:.3f}, F1={metrics['f1-score']:.3f}")
        
    print("\nConfusion Matrix (Rows=True, Cols=Pred [Low, Medium, High]):")
    print(cm)
    
    print("\nTop 5 Most Important Features:")
    for feat, imp in sorted_importances[:5]:
        print(f"  {feat}: {imp * 100:.2f}%")
        
    # Serialize model artifacts
    model_file = os.path.join(models_dir, 'task_priority_rf.joblib')
    scaler_file = os.path.join(models_dir, 'scaler.joblib')
    meta_file = os.path.join(models_dir, 'model_metadata.json')
    
    joblib.dump(rf, model_file)
    joblib.dump(scaler, scaler_file)
    
    metadata = {
        'model_name': 'RandomForestClassifier',
        'n_estimators': 120,
        'max_depth': 12,
        'test_accuracy': round(float(acc), 4),
        'baseline_accuracy': round(float(base_acc), 4),
        'feature_names': all_features,
        'feature_importances': dict(sorted_importances),
        'classes': list(rf.classes_),
        'metrics': report,
        'confusion_matrix': cm.tolist()
    }
    
    with open(meta_file, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nModel artifacts successfully saved to: {models_dir}")
    return metadata

if __name__ == '__main__':
    train_and_evaluate()
