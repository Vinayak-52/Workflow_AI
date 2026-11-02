/**
 * Dedicated ML Model Input Endpoints
 * Member 2: Ankit Kumar Kunwar (2360031) & Member 1: Ayantik Goswami
 * Week 6 Milestone: Add activity logging, model-input endpoint, validation, and error handling
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { MLClient } from '../services/mlClient.js';

const router = Router();
router.use(authMiddleware);

// Model input endpoint for raw feature vectors
router.post('/predict-priority', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const {
      hours_to_deadline,
      is_overdue,
      estimated_duration_min,
      user_importance,
      workload_pending_tasks,
      available_free_minutes,
      category
    } = req.body;

    if (hours_to_deadline === undefined && !is_overdue) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'hours_to_deadline is required' } });
    }

    const prediction = await MLClient.predictPriority({
      hours_to_deadline: Number(hours_to_deadline || 24),
      is_overdue: is_overdue ? 1 : 0,
      estimated_duration_min: Number(estimated_duration_min || 60),
      user_importance: Number(user_importance || 3),
      workload_pending_tasks: Number(workload_pending_tasks || 5),
      workload_minutes_today: 180,
      available_free_minutes: Number(available_free_minutes || 120),
      historical_completion_rate: 0.85,
      dependency_count: 0,
      category: category || 'project'
    });

    return res.json({ prediction });
  } catch (err) {
    next(err);
  }
});

// Smart reminders evaluation model-input endpoint
router.post('/smart-reminders', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { tasks = [], user_context = {} } = req.body;
    const reminders = await MLClient.evaluateSmartReminders(tasks, user_context);
    return res.json({ reminders });
  } catch (err) {
    next(err);
  }
});

// NLP Summarize model-input endpoint
router.post('/summarize', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { text = '', max_sentences = 3 } = req.body;
    if (!text) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text content is required' } });
    }
    const result = await MLClient.summarize(text, Number(max_sentences));
    return res.json({ result });
  } catch (err) {
    next(err);
  }
});

// Feedback and adaptation stats
router.get('/feedback-stats', async (_req: AuthenticatedRequest, res: Response, next) => {
  try {
    const stats = await MLClient.getFeedbackStats();
    return res.json({ stats });
  } catch (err) {
    next(err);
  }
});

export default router;
