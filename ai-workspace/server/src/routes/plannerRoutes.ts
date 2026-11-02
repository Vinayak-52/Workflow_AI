/**
 * Daily Planner Endpoints
 * Member 1 (Ayantik Goswami) & Member 2 (Ankit Kumar Kunwar)
 * Aligned with 07 - API Specification.md Section 6
 */

import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { activityLogger } from '../middleware/activityLogger.js';
import { PlannerService } from '../services/plannerService.js';

const router = Router();
router.use(authMiddleware);

// Generate Daily Plan
router.post('/daily', activityLogger('plan', 'PLAN_GENERATED'), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const targetDateStr = (req.body.date as string) || new Date().toISOString().split('T')[0];

  const plan = PlannerService.generateDailyPlan(userId, targetDateStr);
  return res.json({ plan });
});

// Get Plan by Date
router.get('/:date', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const targetDateStr = req.params.date;

  const plan = db.getDailyPlan(userId, targetDateStr);
  if (!plan) {
    // Generate dynamically if not found
    const generated = PlannerService.generateDailyPlan(userId, targetDateStr);
    return res.json({ plan: generated });
  }
  return res.json({ plan });
});

// Save Reviewed Plan
router.post('/save', activityLogger('plan', 'PLAN_SAVED'), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { plan } = req.body;
  if (!plan) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Plan object required' } });
  }
  plan.userId = userId;
  plan.updatedAt = new Date().toISOString();
  db.saveDailyPlan(plan);
  return res.json({ success: true, plan });
});

export default router;
