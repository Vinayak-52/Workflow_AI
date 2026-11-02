"""
End-to-End System Integration Test Suite
Member 4: Yash Raj (2360014)
Week 6 Milestone: Run integration testing across frontend, APIs, database, and AI services.
"""

import os
import sys
import json
import time
from datetime import datetime, timezone
import unittest
import urllib.request
import urllib.error

API_BASE = "http://localhost:5000/api/v1"
ML_BASE = "http://localhost:5001"

class TestE2EIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        pass

    def _http_get(self, url, headers=None):
        headers = headers or {}
        req = urllib.request.Request(url, headers=headers, method='GET')
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode('utf-8'))

    def _http_post(self, url, data, headers=None):
        headers = headers or {}
        headers['Content-Type'] = 'application/json'
        body = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=body, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode('utf-8'))

    def _http_patch(self, url, data, headers=None):
        headers = headers or {}
        headers['Content-Type'] = 'application/json'
        body = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=body, headers=headers, method='PATCH')
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode('utf-8'))

    def test_01_backend_health(self):
        try:
            status, body = self._http_get(f"{API_BASE}/health")
            self.assertEqual(status, 200)
            self.assertEqual(body.get('status'), 'healthy')
        except urllib.error.URLError:
            self.skipTest("Backend server is not currently running on port 5000.")

    def test_02_clock_metadata(self):
        try:
            status, body = self._http_get(f"{API_BASE}/clock?timezone=Asia/Kolkata")
            self.assertEqual(status, 200)
            self.assertEqual(body.get('timezone'), 'Asia/Kolkata')
            self.assertEqual(body.get('utcOffset'), '+05:30')
        except urllib.error.URLError:
            self.skipTest("Backend server is not currently running on port 5000.")

    def test_03_task_crud_and_ml_prediction(self):
        try:
            headers = {'x-demo-mode': 'true'}
            payload = {
                'title': 'E2E Integration Test Task',
                'description': 'Verified by Yash Raj',
                'category': 'academic',
                'userPriority': 'high',
                'estimatedMinutes': 90
            }
            status, body = self._http_post(f"{API_BASE}/tasks", payload, headers)
            self.assertEqual(status, 201)
            task = body['task']
            self.assertIn('predictedPriority', task)
            self.assertIn('priorityScore', task)
            self.assertEqual(task['title'], payload['title'])
            
            # Test Priority Override & Feedback
            task_id = task['id']
            patch_status, patch_body = self._http_patch(
                f"{API_BASE}/tasks/{task_id}",
                {'userPriority': 'medium'},
                headers
            )
            self.assertEqual(patch_status, 200)
            self.assertEqual(patch_body['task']['userPriority'], 'medium')
        except urllib.error.URLError:
            self.skipTest("Backend server is not currently running on port 5000.")

    def test_04_deterministic_daily_plan(self):
        try:
            headers = {'x-demo-mode': 'true'}
            today_str = time.strftime('%Y-%m-%d')
            status, body = self._http_post(f"{API_BASE}/planner/daily", {'date': today_str}, headers)
            self.assertEqual(status, 200)
            plan = body['plan']
            self.assertEqual(plan['planDate'], today_str)
            self.assertIsInstance(plan['blocks'], list)
            
            # Verify chronological sequencing of blocks using parsed timestamps
            blocks = plan['blocks']
            for i in range(len(blocks) - 1):
                t_end_cur = datetime.fromisoformat(blocks[i]['endAt'].replace('Z', '+00:00')).timestamp()
                t_start_next = datetime.fromisoformat(blocks[i+1]['startAt'].replace('Z', '+00:00')).timestamp()
                # Ensure no block overlaps with the next block
                self.assertLessEqual(t_end_cur, t_start_next + 60) # within 1 minute tolerance
        except urllib.error.URLError:
            self.skipTest("Backend server is not currently running on port 5000.")

    def test_05_smart_reminders_evaluation(self):
        try:
            headers = {'x-demo-mode': 'true'}
            status, body = self._http_get(f"{API_BASE}/reminders/smart-eval", headers)
            self.assertEqual(status, 200)
            self.assertIn('evaluatedCount', body)
            self.assertIn('activeReminders', body)
        except urllib.error.URLError:
            self.skipTest("Backend server is not currently running on port 5000.")

    def test_06_grounded_assistant_chat(self):
        try:
            headers = {'x-demo-mode': 'true'}
            status, body = self._http_post(
                f"{API_BASE}/assistant/chat",
                {'message': 'What are my top priorities today?'},
                headers
            )
            self.assertEqual(status, 200)
            self.assertIn('answer', body)
            self.assertIsInstance(body['sources'], list)
        except urllib.error.URLError:
            self.skipTest("Backend server is not currently running on port 5000.")

if __name__ == '__main__':
    unittest.main()
