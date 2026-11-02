/**
 * Smart Reminder Service Endpoints
 * Member 2: Ankit Kumar Kunwar (2360031) & Member 1: Ayantik Goswami
 * Week 4 Milestone: Implement reminder service and notification scheduling endpoints
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { activityLogger } from '../middleware/activityLogger.js';
import { MLClient } from '../services/mlClient.js';
import { Reminder } from '../models/types.js';

const router = Router();
router.use(authMiddleware);

// Get User Reminders
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const includeDismissed = req.query.includeDismissed === 'true';

  let reminders = db.getRemindersByUserId(userId);
  if (!includeDismissed) {
    reminders = reminders.filter(r => !r.isDismissed);
  }

  // Sort by urgency score descending
  reminders.sort((a, b) => b.urgencyScore - a.urgencyScore);

  return res.json({ reminders, count: reminders.length });
});

// Run Smart Reminder Dynamic Evaluation across all active tasks
router.get('/smart-eval', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const activeTasks = db.getTasksByUserId(userId).filter(t => t.status !== 'done');
    const now = new Date();

    const taskPayloads = activeTasks.map(t => {
      const hoursToDeadline = (new Date(t.dueAt).getTime() - now.getTime()) / (3600 * 1000);
      return {
        task_id: t.id,
        title: t.title,
        hours_to_deadline: hoursToDeadline,
        is_overdue: hoursToDeadline < 0 ? 1 : 0,
        estimated_duration_min: t.estimatedMinutes,
        user_importance: t.userPriority === 'high' ? 5 : (t.userPriority === 'medium' ? 3 : 1),
        priorityScore: t.priorityScore
      };
    });

    const evaluated = await MLClient.evaluateSmartReminders(taskPayloads, {
      available_free_minutes: 180,
      pending_tasks_count: activeTasks.length
    });

    // Automatically sync actionable reminders into the user reminder store
    for (const item of evaluated) {
      if (item.should_remind_now) {
        const existing = db.getRemindersByUserId(userId).find(r => r.taskId === item.task_id && !r.isDismissed);
        if (!existing) {
          db.saveReminder({
            id: `rem-${uuidv4().slice(0, 8)}`,
            userId,
            taskId: item.task_id,
            title: item.title,
            level: item.level,
            message: item.message,
            urgencyScore: item.urgency_score,
            triggerAt: new Date().toISOString(),
            isDismissed: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    const currentReminders = db.getRemindersByUserId(userId).filter(r => !r.isDismissed);
    return res.json({
      evaluatedCount: evaluated.length,
      activeReminders: currentReminders,
      rawEvaluation: evaluated
    });
  } catch (err) {
    next(err);
  }
});

// Explicitly Schedule a Reminder
router.post('/schedule', activityLogger('reminder', 'REMINDER_SCHEDULED'), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { taskId, title, message, level = 'info', triggerAt, urgencyScore = 50 } = req.body;

  if (!title || !triggerAt) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Title and triggerAt are required' } });
  }

  const newReminder: Reminder = {
    id: `rem-${uuidv4().slice(0, 8)}`,
    userId,
    taskId: taskId || 'general',
    title,
    level,
    message: message || `Reminder: ${title}`,
    urgencyScore: Number(urgencyScore),
    triggerAt: triggerAt,
    isDismissed: false,
    createdAt: new Date().toISOString()
  };

  db.saveReminder(newReminder);
  return res.status(201).json({ reminder: newReminder });
});

// Dismiss Reminder
router.patch('/:id/dismiss', activityLogger('reminder', 'REMINDER_DISMISSED'), (req: AuthenticatedRequest, res: Response) => {
  const success = db.dismissReminder(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reminder not found or already dismissed' } });
  }
  return res.json({ success: true, message: 'Reminder dismissed' });
});

export default router;
