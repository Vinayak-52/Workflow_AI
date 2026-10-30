import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PlannerService } from '../planner/planner.service.js';
import { db } from '../services/db.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

// POST /api/v1/planner/daily - Generate daily plan
router.post('/daily', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetDate = req.body.date || new Date().toISOString().split('T')[0];
    const plan = await PlannerService.generateDailyPlan(req.userId!, targetDate);
    res.json({ plan });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/plans/:planId - Get saved plan
router.get('/:planId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await db.getPlan(req.userId!, req.params.planId);
    if (!plan) {
      throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }
    res.json({ plan });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/plans - Save reviewed plan
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planData = req.body;
    await db.savePlan(planData);
    res.status(201).json({ plan: planData });
  } catch (err) {
    next(err);
  }
});

export default router;
