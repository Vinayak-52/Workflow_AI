/**
 * Activity Logging REST API
 * Member 2: Ankit Kumar Kunwar (2360031)
 * Week 6 Milestone: Add activity logging, model-input endpoint, validation, and error handling
 */

import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const limit = Math.min(100, Number(req.query.limit || 50));
  const logs = db.getActivityLogs(userId, limit);

  return res.json({
    logs,
    count: logs.length
  });
});

export default router;
