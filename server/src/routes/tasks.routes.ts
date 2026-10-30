import { Router, Request, Response, NextFunction } from 'express';
import { TasksService } from '../services/tasks.service.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  userPriority: z.enum(['low', 'medium', 'high']).optional(),
  dueAt: z.string().nullable().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  sourceType: z.enum(['manual', 'email', 'note', 'ai']).optional(),
  sourceReference: z.object({
    type: z.string(),
    id: z.string(),
    label: z.string().optional(),
  }).nullable().optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial();

// GET /tasks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const dueBefore = req.query.dueBefore as string | undefined;
    const tasks = await TasksService.listTasks(req.userId!, { status, dueBefore });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// POST /tasks
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateTaskSchema.parse(req.body);
    const task = await TasksService.createTask(req.userId!, validated);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:taskId
router.get('/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await TasksService.getTask(req.userId!, req.params.taskId);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// PATCH /tasks/:taskId
router.patch('/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateTaskSchema.parse(req.body);
    const task = await TasksService.updateTask(req.userId!, req.params.taskId, validated);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:taskId
router.delete('/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TasksService.deleteTask(req.userId!, req.params.taskId);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /tasks/:taskId/priority - Refresh model prediction or baseline score
router.post('/:taskId/priority', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await TasksService.refreshPriority(req.userId!, req.params.taskId);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

export default router;
