import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AssistantService } from '../ai/assistant.service.js';

const router = Router();
router.use(requireAuth);

// POST /api/v1/assistant/chat
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, context } = req.body;
    const response = await AssistantService.handleChat(
      req.userId!,
      message || '',
      context || { type: 'global' }
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
