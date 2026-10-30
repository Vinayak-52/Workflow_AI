import { Router, Request, Response, NextFunction } from 'express';
import { NotesService } from '../services/notes.service.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

const CreateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const UpdateNoteSchema = CreateNoteSchema.partial();

// GET /notes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string | undefined;
    const tag = req.query.tag as string | undefined;
    const notes = await NotesService.listNotes(req.userId!, q, tag);
    res.json({ notes });
  } catch (err) {
    next(err);
  }
});

// POST /notes
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateNoteSchema.parse(req.body);
    const note = await NotesService.createNote(req.userId!, validated);
    res.status(201).json({ note });
  } catch (err) {
    next(err);
  }
});

// GET /notes/:noteId
router.get('/:noteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const note = await NotesService.getNote(req.userId!, req.params.noteId);
    res.json({ note });
  } catch (err) {
    next(err);
  }
});

// PATCH /notes/:noteId
router.patch('/:noteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateNoteSchema.parse(req.body);
    const note = await NotesService.updateNote(req.userId!, req.params.noteId, validated);
    res.json({ note });
  } catch (err) {
    next(err);
  }
});

// DELETE /notes/:noteId
router.delete('/:noteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await NotesService.deleteNote(req.userId!, req.params.noteId);
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
