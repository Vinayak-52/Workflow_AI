"""
AI & ML HTTP Microservice
Member 1: Ayantik Goswami (2360006)
Integrates:
- Random Forest Task Prioritization
- Baseline Heuristic Rules Fallback
- Smart Reminders Engine
- Document & Note Summarization Engine
- Continuous Learning Feedback Loop
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
from baseline_rules import compute_baseline_priority
from smart_reminders import evaluate_smart_reminder, batch_evaluate_reminders
from summarizer import DocumentSummarizer
from continuous_learning import ContinuousLearningPipeline

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, '..', 'models')
MODEL_PATH = os.path.join(MODELS_DIR, 'task_priority_rf.joblib')
SCALER_PATH = os.path.join(MODELS_DIR, 'scaler.joblib')
METADATA_PATH = os.path.join(MODELS_DIR, 'model_metadata.json')

# Global ML singletons
MODEL = None
SCALER = None
METADATA = {}
SUMMARIZER = DocumentSummarizer()
CONTINUOUS_LEARNER = ContinuousLearningPipeline()

def load_ml_models():
    global MODEL, SCALER, METADATA
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            MODEL = joblib.load(MODEL_PATH)
            SCALER = joblib.load(SCALER_PATH)
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, 'r') as f:
                    METADATA = json.load(f)
            print("[ML Service] Successfully loaded Random Forest model and scaler.")
        else:
            print("[ML Service] Model files not found. Using baseline rules fallback.")
    except Exception as e:
        print(f"[ML Service] Error loading models: {e}. Falling back to baseline rules.")

def predict_task_priority(task_data: dict) -> dict:
    global MODEL, SCALER, METADATA, CONTINUOUS_LEARNER
    
    hours_to_deadline = float(task_data.get('hours_to_deadline', 24.0))
    is_overdue = 1 if (task_data.get('is_overdue') or hours_to_deadline < 0) else 0
    estimated_duration_min = int(task_data.get('estimated_duration_min', task_data.get('estimatedMinutes', 60)))
    user_importance = int(task_data.get('user_importance', 3))
    workload_pending_tasks = int(task_data.get('workload_pending_tasks', 5))
    workload_minutes_today = int(task_data.get('workload_minutes_today', 180))
    available_free_minutes = float(task_data.get('available_free_minutes', 120.0))
    historical_completion_rate = float(task_data.get('historical_completion_rate', 0.85))
    dependency_count = int(task_data.get('dependency_count', 0))
    category = task_data.get('category', 'project').lower()

    # Apply continuous learning category weight adjustments if present
    insights = CONTINUOUS_LEARNER.compute_feedback_insights()
    cat_boost = insights.get('category_weights', {}).get(category, 1.0)
    adjusted_importance = min(5, max(1, int(round(user_importance * cat_boost))))

    # Fallback to Baseline rules if model is unavailable
    if MODEL is None or SCALER is None:
        label, score, rationale = compute_baseline_priority({
            'hours_to_deadline': hours_to_deadline,
            'is_overdue': is_overdue,
            'user_importance': adjusted_importance,
            'estimated_duration_min': estimated_duration_min,
            'available_free_minutes': available_free_minutes,
            'workload_pending_tasks': workload_pending_tasks,
            'dependency_count': dependency_count
        })
        return {
            'predicted_priority': label,
            'priority_score': score,
            'probabilities': {label: 1.0},
            'method': 'baseline_rules_fallback',
            'rationale': rationale,
            'model_version': 'baseline-v1.0'
        }

    # Vectorize input according to model features
    cat_academic = 1 if category == 'academic' else 0
    cat_administrative = 1 if category == 'administrative' else 0
    cat_personal = 1 if category == 'personal' else 0
    cat_project = 1 if category == 'project' else 0

    feature_vector = np.array([[
        hours_to_deadline,
        is_overdue,
        estimated_duration_min,
        adjusted_importance,
        workload_pending_tasks,
        workload_minutes_today,
        available_free_minutes,
        historical_completion_rate,
        dependency_count,
        cat_academic,
        cat_administrative,
        cat_personal,
        cat_project
    ]], dtype=float)

    try:
        X_scaled = SCALER.transform(feature_vector)
        pred_label = MODEL.predict(X_scaled)[0]
        probs = MODEL.predict_proba(X_scaled)[0]
        prob_dict = {cls: round(float(p), 4) for cls, p in zip(MODEL.classes_, probs)}
        
        # Calculate continuous priority score (0-100)
        # Weighting: Low: 20, Medium: 60, High: 95
        score = (
            prob_dict.get('low', 0.0) * 20.0 +
            prob_dict.get('medium', 0.0) * 60.0 +
            prob_dict.get('high', 0.0) * 95.0
        )
        score = round(float(score), 1)

        rationale = (
            f"Random Forest predicted '{pred_label}' (confidence {prob_dict.get(pred_label, 0)*100:.1f}%) "
            f"based on deadline proximity ({hours_to_deadline:.1f}h), "
            f"calendar free time ({available_free_minutes:.0f}m), "
            f"and user importance ({adjusted_importance}/5)."
        )

        return {
            'predicted_priority': pred_label,
            'priority_score': score,
            'probabilities': prob_dict,
            'method': 'random_forest_classifier',
            'rationale': rationale,
            'model_version': 'rf-v1.0'
        }
    except Exception as e:
        label, score, rationale = compute_baseline_priority(task_data)
        return {
            'predicted_priority': label,
            'priority_score': score,
            'probabilities': {label: 1.0},
            'method': 'baseline_rules_fallback_on_error',
            'rationale': f"Fallback due to: {str(e)}",
            'model_version': 'baseline-v1.0'
        }

class MLRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        response_bytes = json.dumps(data, indent=2).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ['/health', '/api/v1/health', '/']:
            self._send_json(200, {
                'status': 'healthy',
                'service': 'ai-workspace-ml-service',
                'version': '1.0.0',
                'model_loaded': MODEL is not None,
                'accuracy': METADATA.get('test_accuracy', 0.887)
            })
        elif path == '/api/v1/ml/metadata':
            self._send_json(200, METADATA)
        elif path == '/api/v1/ml/feedback-stats':
            stats = CONTINUOUS_LEARNER.compute_feedback_insights()
            self._send_json(200, stats)
        else:
            self._send_json(404, {'error': f"Endpoint '{path}' not found"})

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length)
        try:
            body = json.loads(post_body.decode('utf-8')) if post_body else {}
        except Exception:
            body = {}

        path = urllib.parse.urlparse(self.path).path

        if path in ['/predict-priority', '/api/v1/ml/predict-priority']:
            result = predict_task_priority(body)
            self._send_json(200, result)

        elif path in ['/smart-reminders', '/api/v1/ml/smart-reminders']:
            tasks = body.get('tasks', [body] if 'title' in body else [])
            user_context = body.get('user_context', {})
            results = batch_evaluate_reminders(tasks, user_context)
            self._send_json(200, {'reminders': results, 'count': len(results)})

        elif path in ['/summarize', '/api/v1/ml/summarize']:
            text = body.get('text', '')
            max_sentences = int(body.get('max_sentences', 4))
            res = SUMMARIZER.summarize_extractive(text, max_sentences=max_sentences)
            self._send_json(200, res)

        elif path in ['/evaluate-summary', '/api/v1/ml/evaluate-summary']:
            reference = body.get('reference', '')
            candidate = body.get('candidate', '')
            scores = SUMMARIZER.compute_rouge_scores(reference, candidate)
            self._send_json(200, scores)

        elif path in ['/feedback', '/api/v1/ml/feedback']:
            res = CONTINUOUS_LEARNER.record_task_feedback(
                task_id=body.get('task_id', 'TASK-UNKNOWN'),
                predicted_priority=body.get('predicted_priority', 'medium'),
                user_priority=body.get('user_priority', 'medium'),
                completed_on_time=body.get('completed_on_time', True),
                hours_to_deadline=float(body.get('hours_to_deadline', 12.0)),
                actual_duration_min=int(body.get('actual_duration_min', 60)),
                estimated_duration_min=int(body.get('estimated_duration_min', 60)),
                category=body.get('category', 'project')
            )
            self._send_json(200, res)

        else:
            self._send_json(404, {'error': f"Endpoint '{path}' not found"})

def run_server(port: int = 5001):
    load_ml_models()
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, MLRequestHandler)
    print(f"[ML Service] Running on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[ML Service] Stopping server.")
        httpd.server_close()

if __name__ == '__main__':
    run_server(port=5001)
