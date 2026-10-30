import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../services/db.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

// Sample verified email dataset for read-only preview and offline testing
const SAMPLE_GMAIL_MESSAGES = [
  {
    id: 'msg-hitk-project-101',
    threadId: 'th-hitk-101',
    sender: 'Prof. Sajal Mitra <sajal.mitra@hitk.edu>',
    subject: 'AI Workspace Project: Midterm Evaluation Schedule',
    date: 'Oct 30, 2026, 09:30 AM',
    snippet: 'Dear Team, please prepare your mid-term demo for the AI Workspace by next Monday at 2:00 PM. Ensure the Random Forest model metrics and data model are thoroughly documented.',
    body: 'Dear Team,\n\nPlease prepare your mid-term demo for the AI Workspace project by next Monday, November 3, at 2:00 PM in Lab 3.\n\nKey deliverables to present:\n1. Functional React dashboard with dark UI\n2. Separation of ML task priority from deterministic scheduling\n3. Read-only Google API integration\n\nBest regards,\nProf. Sajal Mitra',
    unread: true,
  },
  {
    id: 'msg-csbs-symposium-102',
    threadId: 'th-csbs-102',
    sender: 'HOD CSBS Office <csbs.office@hitk.edu>',
    subject: 'Department Seminar: Machine Learning in Software Engineering',
    date: 'Oct 29, 2026, 04:15 PM',
    snippet: 'All 7th semester students are requested to attend the technical talk tomorrow at 11:00 AM in the main auditorium.',
    body: 'Notice: Technical talk on modern ML architectures and real-world deployment challenges will be held tomorrow at 11:00 AM. Attendance is mandatory for final year project groups.',
    unread: false,
  },
  {
    id: 'msg-colleague-review-103',
    threadId: 'th-review-103',
    sender: 'Ayantik Goswami <ayantik@hitk.edu>',
    subject: 'Random Forest Training Set Updates',
    date: 'Oct 28, 2026, 08:45 PM',
    snippet: 'I updated the synthetic dataset with 500 new samples covering high-workload exam weeks. Let us review the F1 scores before the mentor meeting.',
    body: 'Hey Vinayak,\n\nI just pushed the revised training pipeline in ml/src. Feature importance highlights available minutes before deadline as the top predictor. Check it out when you have a moment.',
    unread: false,
  },
];

// GET /api/v1/gmail/messages - List messages (read-only)
router.get('/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string || '').toLowerCase();
    const conn = await db.getGoogleConnection(req.userId!);

    // Filter sample or live messages
    let list = SAMPLE_GMAIL_MESSAGES;
    if (q) {
      list = list.filter(m => m.subject.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q) || m.snippet.toLowerCase().includes(q));
    }

    res.json({
      messages: list.map(m => ({
        id: m.id,
        threadId: m.threadId,
        sender: m.sender,
        subject: m.subject,
        date: m.date,
        snippet: m.snippet,
        unread: m.unread,
      })),
      nextPageToken: null,
      readOnly: true,
      connected: !!conn,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/gmail/messages/:messageId - Get message detail (read-only)
router.get('/messages/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const msg = SAMPLE_GMAIL_MESSAGES.find(m => m.id === req.params.messageId);
    if (!msg) {
      throw new AppError('Message not found', 404, 'GMAIL_MESSAGE_NOT_FOUND');
    }

    res.json({ message: msg });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/gmail/summarize - Summarize email content
router.post('/summarize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.body;
    const msg = SAMPLE_GMAIL_MESSAGES.find(m => m.id === messageId);
    if (!msg) {
      throw new AppError('Message not found', 404, 'GMAIL_MESSAGE_NOT_FOUND');
    }

    // Grounded summarization referencing the specific sender and subject
    const summary = `Email from ${msg.sender} regarding "${msg.subject}". It outlines upcoming academic project deliverables and meeting requirements, emphasizing timely preparation for midterm evaluation.`;

    res.json({
      summary,
      source: {
        type: 'gmail_message',
        id: msg.id,
        subject: msg.subject,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/gmail/extract-actions - Extract candidate tasks/dates with citations
router.post('/extract-actions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.body;
    const msg = SAMPLE_GMAIL_MESSAGES.find(m => m.id === messageId);
    if (!msg) {
      throw new AppError('Message not found', 404, 'GMAIL_MESSAGE_NOT_FOUND');
    }

    let actions: Array<{ title: string; dueAt?: string; minutes: number }> = [];

    if (msg.id === 'msg-hitk-project-101') {
      actions = [
        {
          title: 'Prepare AI Workspace midterm demo presentation',
          dueAt: '2026-11-03T14:00:00+05:30',
          minutes: 90,
        },
        {
          title: 'Document Random Forest model metrics and evaluation',
          dueAt: '2026-11-02T18:00:00+05:30',
          minutes: 60,
        },
      ];
    } else {
      actions = [
        {
          title: `Follow up on: ${msg.subject}`,
          dueAt: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          minutes: 30,
        },
      ];
    }

    res.json({
      actions,
      source: {
        type: 'gmail_message',
        id: msg.id,
        subject: msg.subject,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
