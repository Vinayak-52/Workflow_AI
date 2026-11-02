/**
 * Notes Module REST APIs
 * Member 2: Ankit Kumar Kunwar & Member 3: Vinayak Chandra
 * Aligned with 04 - Functional Requirements.md Section 5
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { activityLogger } from '../middleware/activityLogger.js';
import { MLClient } from '../services/mlClient.js';
import { Note } from '../models/types.js';

const router = Router();
router.use(authMiddleware);

// List / Search Notes
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  let notes = db.getNotesByUserId(userId);

  const { q, tag } = req.query;
  if (tag) {
    notes = notes.filter(n => n.tags.includes(String(tag)));
  }
  if (q) {
    const query = String(q).toLowerCase();
    notes = notes.filter(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
  }

  // Sort: pinned first, then updatedAt descending
  notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return res.json({ notes, count: notes.length });
});

// Create Note
router.post('/', activityLogger('note', 'NOTE_CREATED'), (req: AuthenticatedRequest, res: Response) => {
  const { title = 'Untitled Note', content = '', pinned = false, tags = [] } = req.body;
  const now = new Date().toISOString();

  const newNote: Note = {
    id: `note-${uuidv4().slice(0, 8)}`,
    userId: req.user!.id,
    title,
    content,
    format: 'markdown',
    pinned: Boolean(pinned),
    tags: Array.isArray(tags) ? tags : [],
    createdAt: now,
    updatedAt: now
  };

  db.saveNote(newNote);
  return res.status(201).json({ note: newNote });
});

// Get Note by ID
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const note = db.getNoteById(req.params.id, req.user!.id);
  if (!note) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Note not found' } });
  }
  return res.json({ note });
});

// Update Note (Autosave endpoint)
router.patch('/:id', activityLogger('note', 'NOTE_UPDATED'), (req: AuthenticatedRequest, res: Response) => {
  const note = db.getNoteById(req.params.id, req.user!.id);
  if (!note) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Note not found' } });
  }

  const { title, content, pinned, tags } = req.body;
  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (pinned !== undefined) note.pinned = Boolean(pinned);
  if (tags !== undefined && Array.isArray(tags)) note.tags = tags;

  note.updatedAt = new Date().toISOString();
  db.saveNote(note);

  return res.json({ note, autosavedAt: note.updatedAt });
});

// Delete Note
router.delete('/:id', activityLogger('note', 'NOTE_DELETED'), (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteNote(req.params.id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Note not found' } });
  }
  return res.json({ success: true, message: 'Note deleted successfully' });
});

// AI Note Action (Summarize / Extract Tasks)
router.post('/:id/ai', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const note = db.getNoteById(req.params.id, req.user!.id);
    if (!note) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Note not found' } });
    }

    const { action = 'summarize' } = req.body;

    if (action === 'summarize') {
      const summaryResult = await MLClient.summarize(note.content, 3);
      return res.json({
        action: 'summarize',
        noteId: note.id,
        summary: summaryResult.summary,
        keyTakeaways: summaryResult.key_takeaways,
        compressionRatio: summaryResult.compression_ratio,
        factualityScore: summaryResult.factuality_score
      });
    } else if (action === 'extract_tasks') {
      const summaryResult = await MLClient.summarize(note.content, 4);
      const extracted = summaryResult.action_items || [];
      return res.json({
        action: 'extract_tasks',
        noteId: note.id,
        candidateTasks: extracted.map((item: any) => ({
          title: item.action,
          sourceType: 'note',
          sourceReference: `Note: ${note.title} (ID: ${note.id})`,
          estimatedMinutes: 60,
          userPriority: 'medium'
        }))
      });
    }

    return res.status(400).json({ error: { code: 'INVALID_ACTION', message: `Unknown AI action: ${action}` } });
  } catch (err) {
    next(err);
  }
});

export default router;
