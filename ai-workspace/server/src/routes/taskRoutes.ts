/**
 * Task Management REST APIs
 * Member 2: Ankit Kumar Kunwar (2360031) & Member 1: Ayantik Goswami
 * Weeks 2-3 & Week 6 Milestones: CRUD, ML Prioritization & Feedback
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { activityLogger } from '../middleware/activityLogger.js';
import { MLClient } from '../services/mlClient.js';
import { Task } from '../models/types.js';

const router = Router();
router.use(authMiddleware);

// List Tasks with filters
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  let tasks = db.getTasksByUserId(userId);

  const { status, priority, category, q } = req.query;

  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  if (priority) {
    tasks = tasks.filter(t => t.userPriority === priority || t.predictedPriority === priority);
  }
  if (category) {
    tasks = tasks.filter(t => t.category === category);
  }
  if (q) {
    const query = String(q).toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
  }

  // Update isOverdue status dynamically based on current time
  const now = new Date();
  tasks = tasks.map(t => {
    const isOverdue = t.status !== 'done' && new Date(t.dueAt).getTime() < now.getTime();
    return { ...t, isOverdue };
  });

  return res.json({ tasks, count: tasks.length });
});

// Create Task
router.post('/', activityLogger('task', 'TASK_CREATED'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description = '',
      category = 'project',
      userPriority = 'medium',
      dueAt,
      estimatedMinutes = 60,
      dependencyCount = 0,
      sourceType = 'manual',
      sourceReference
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Task title is required' } });
    }

    if (dueAt && new Date(dueAt).getTime() < Date.now() - 60000) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Task deadline cannot be in the past. Please select a future date and time.'
        }
      });
    }

    const dueDate = dueAt ? new Date(dueAt) : new Date(Date.now() + 24 * 3600 * 1000);
    const now = new Date();
    const hoursToDeadline = (dueDate.getTime() - now.getTime()) / (3600 * 1000);
    const isOverdue = hoursToDeadline < 0;

    // Call ML Priority Prediction (Random Forest)
    const mlResult = await MLClient.predictPriority({
      hours_to_deadline: hoursToDeadline,
      is_overdue: isOverdue ? 1 : 0,
      estimated_duration_min: estimatedMinutes,
      user_importance: userPriority === 'high' ? 5 : (userPriority === 'medium' ? 3 : 1),
      workload_pending_tasks: db.getTasksByUserId(userId).filter(t => t.status !== 'done').length,
      workload_minutes_today: 180,
      available_free_minutes: 120,
      historical_completion_rate: 0.85,
      dependency_count: dependencyCount,
      category
    });

    const newTask: Task = {
      id: `task-${uuidv4().slice(0, 8)}`,
      userId,
      title,
      description,
      status: 'todo',
      category,
      userPriority,
      predictedPriority: mlResult.predicted_priority,
      priorityScore: mlResult.priority_score,
      dueAt: dueDate.toISOString(),
      estimatedMinutes: Number(estimatedMinutes),
      isOverdue,
      dependencyCount: Number(dependencyCount),
      sourceType,
      sourceReference,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    db.saveTask(newTask);

    return res.status(201).json({
      task: newTask,
      mlRationale: mlResult.rationale,
      method: mlResult.method
    });
  } catch (err) {
    next(err);
  }
});

// Get Task by ID
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const task = db.getTaskById(req.params.id, req.user!.id);
  if (!task) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
  }
  return res.json({ task });
});

// Update Task
router.patch('/:id', activityLogger('task', 'TASK_UPDATED'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const task = db.getTaskById(req.params.id, req.user!.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const { title, description, status, userPriority, dueAt, estimatedMinutes, category } = req.body;

    const oldStatus = task.status;
    const oldUserPriority = task.userPriority;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (category !== undefined) task.category = category;
    if (dueAt !== undefined) {
      if (task.status !== 'done' && new Date(dueAt).getTime() < Date.now() - 60000) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Task deadline cannot be in the past. Please select a future date and time.'
          }
        });
      }
      task.dueAt = dueAt;
    }
    if (estimatedMinutes !== undefined) task.estimatedMinutes = Number(estimatedMinutes);

    // Manual Priority Override tracking
    if (userPriority !== undefined && userPriority !== oldUserPriority) {
      task.userPriority = userPriority;
      // Record override feedback to ML model continuous learning
      await MLClient.recordFeedback({
        task_id: task.id,
        predicted_priority: task.predictedPriority,
        user_priority: userPriority,
        completed_on_time: true,
        hours_to_deadline: 24,
        actual_duration_min: task.estimatedMinutes,
        estimated_duration_min: task.estimatedMinutes,
        category: task.category
      });
    }

    if (status !== undefined) {
      task.status = status;
      if (status === 'done' && oldStatus !== 'done') {
        task.completedAt = new Date().toISOString();
        const now = new Date();
        const dueTime = new Date(task.dueAt).getTime();
        const completedOnTime = now.getTime() <= dueTime;

        // Record completion feedback for continuous learning
        await MLClient.recordFeedback({
          task_id: task.id,
          predicted_priority: task.predictedPriority,
          user_priority: task.userPriority,
          completed_on_time: completedOnTime,
          hours_to_deadline: (dueTime - now.getTime()) / (3600 * 1000),
          actual_duration_min: task.estimatedMinutes,
          estimated_duration_min: task.estimatedMinutes,
          category: task.category
        });
      }
    }

    task.updatedAt = new Date().toISOString();
    db.saveTask(task);

    return res.json({ task });
  } catch (err) {
    next(err);
  }
});

// Delete Task
router.delete('/:id', activityLogger('task', 'TASK_DELETED'), (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteTask(req.params.id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
  }
  return res.json({ success: true, message: 'Task deleted successfully' });
});

// Force Priority Re-prediction
router.post('/:id/priority', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const task = db.getTaskById(req.params.id, req.user!.id);
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const now = new Date();
    const hoursToDeadline = (new Date(task.dueAt).getTime() - now.getTime()) / (3600 * 1000);

    const mlResult = await MLClient.predictPriority({
      hours_to_deadline: hoursToDeadline,
      is_overdue: hoursToDeadline < 0 ? 1 : 0,
      estimated_duration_min: task.estimatedMinutes,
      user_importance: task.userPriority === 'high' ? 5 : (task.userPriority === 'medium' ? 3 : 1),
      workload_pending_tasks: db.getTasksByUserId(req.user!.id).filter(t => t.status !== 'done').length,
      workload_minutes_today: 180,
      available_free_minutes: 120,
      historical_completion_rate: 0.85,
      dependency_count: task.dependencyCount,
      category: task.category
    });

    task.predictedPriority = mlResult.predicted_priority;
    task.priorityScore = mlResult.priority_score;
    task.updatedAt = now.toISOString();
    db.saveTask(task);

    return res.json({
      task,
      mlRationale: mlResult.rationale,
      method: mlResult.method
    });
  } catch (err) {
    next(err);
  }
});

export default router;
