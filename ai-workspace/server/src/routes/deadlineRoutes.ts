/**
 * Deadlines REST APIs
 * Member 2: Ankit Kumar Kunwar (2360031)
 * Week 2 Milestone: Build task, note, user, and deadline REST APIs
 */

import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get Upcoming Deadlines (within next N hours / days)
router.get('/upcoming', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const hours = Number(req.query.hours || 72); // Default next 72 hours
  const now = new Date();
  const cutoff = new Date(now.getTime() + hours * 3600 * 1000);

  const tasks = db.getTasksByUserId(userId).filter(t => {
    if (t.status === 'done') return false;
    const dueTime = new Date(t.dueAt).getTime();
    return dueTime >= now.getTime() && dueTime <= cutoff.getTime();
  });

  // Sort earliest deadline first
  tasks.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return res.json({
    windowHours: hours,
    count: tasks.length,
    deadlines: tasks.map(t => ({
      taskId: t.id,
      title: t.title,
      dueAt: t.dueAt,
      hoursRemaining: Math.round(((new Date(t.dueAt).getTime() - now.getTime()) / (3600 * 1000)) * 10) / 10,
      userPriority: t.userPriority,
      predictedPriority: t.predictedPriority,
      priorityScore: t.priorityScore,
      category: t.category
    }))
  });
});

// Get Overdue Tasks
router.get('/overdue', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const now = new Date();

  const overdue = db.getTasksByUserId(userId).filter(t => {
    if (t.status === 'done') return false;
    return new Date(t.dueAt).getTime() < now.getTime();
  });

  overdue.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return res.json({
    count: overdue.length,
    overdueTasks: overdue.map(t => ({
      taskId: t.id,
      title: t.title,
      dueAt: t.dueAt,
      hoursOverdue: Math.round(((now.getTime() - new Date(t.dueAt).getTime()) / (3600 * 1000)) * 10) / 10,
      priorityScore: t.priorityScore,
      category: t.category
    }))
  });
});

export default router;
