import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { db } from '../../services/db.js';

const router = Router();
router.use(requireAuth);

// Sample Google Calendar events (strictly read-only)
const SAMPLE_CALENDAR_EVENTS = [
  {
    id: 'gcal-event-review-01',
    title: 'Lab 3: AI Workspace Mentor Review',
    start: '10:00',
    end: '11:30',
    calendar: 'College Schedule (HITK)',
    allDay: false,
  },
  {
    id: 'gcal-event-lunch-02',
    title: 'Department Seminar & Lunch',
    start: '13:00',
    end: '14:00',
    calendar: 'Primary',
    allDay: false,
  },
  {
    id: 'gcal-event-sync-03',
    title: 'Sprint Retrospective & Team Sync',
    start: '16:30',
    end: '17:30',
    calendar: 'Primary',
    allDay: false,
  },
];

// GET /api/v1/calendar/calendars
router.get('/calendars', async (req: Request, res: Response) => {
  res.json({
    calendars: [
      { id: 'primary', summary: 'Primary Calendar', primary: true, accessRole: 'reader' },
      { id: 'college', summary: 'College Schedule (HITK)', primary: false, accessRole: 'reader' },
    ],
  });
});

// GET /api/v1/calendar/events
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conn = await db.getGoogleConnection(req.userId!);
    res.json({
      events: SAMPLE_CALENDAR_EVENTS,
      readOnly: true,
      connected: !!conn,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/calendar/freebusy
router.get('/freebusy', async (req: Request, res: Response) => {
  // Deterministic calculation of available working intervals based on 09:00 - 18:00 working day
  // Given events: 10:00-11:30, 13:00-14:00, 16:30-17:30
  // Resulting free slots:
  // 09:00 - 10:00 (60 mins)
  // 11:30 - 13:00 (90 mins)
  // 14:00 - 16:30 (150 mins)
  // 17:30 - 18:00 (30 mins)
  const freeSlots = [
    { start: '09:00', end: '10:00', durationMinutes: 60 },
    { start: '11:30', end: '13:00', durationMinutes: 90 },
    { start: '14:00', end: '16:30', durationMinutes: 150 },
    { start: '17:30', end: '18:00', durationMinutes: 30 },
  ];

  res.json({
    workingHours: { start: '09:00', end: '18:00' },
    busyIntervals: SAMPLE_CALENDAR_EVENTS.map(e => ({ start: e.start, end: e.end, title: e.title })),
    freeSlots,
  });
});

export default router;
