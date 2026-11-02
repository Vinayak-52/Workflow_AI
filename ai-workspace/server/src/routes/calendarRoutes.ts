/**
 * Calendar and Clock Endpoints (Read-Only)
 * Member 2: Ankit Kumar Kunwar & Member 3: Vinayak Chandra
 * Aligned with 07 - API Specification.md Section 4
 */

import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get Calendar Events
router.get('/events', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { timeMin, timeMax } = req.query;

  let events = db.getCalendarEventsByUserId(userId);

  if (timeMin) {
    const minTime = new Date(String(timeMin)).getTime();
    events = events.filter(e => new Date(e.endAt).getTime() >= minTime);
  }
  if (timeMax) {
    const maxTime = new Date(String(timeMax)).getTime();
    events = events.filter(e => new Date(e.startAt).getTime() <= maxTime);
  }

  events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return res.json({
    events,
    count: events.length,
    readOnly: true,
    notice: 'Google Calendar integration is strictly read-only in this version.'
  });
});

// Calculate Free/Busy Intervals
router.get('/freebusy', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.getUserById(userId);
  const events = db.getCalendarEventsByUserId(userId).filter(e => !e.isAllDay);

  const targetDateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const workingHours = user?.preferences?.workingHours || { start: '09:00', end: '18:00' };

  const workStart = new Date(`${targetDateStr}T${workingHours.start}:00`);
  const workEnd = new Date(`${targetDateStr}T${workingHours.end}:00`);

  const busySlots: { start: string; end: string; title: string }[] = [];
  const freeSlots: { start: string; end: string; durationMinutes: number }[] = [];

  let cursor = new Date(workStart);

  const dayEvents = events.filter(e => e.startAt.startsWith(targetDateStr));
  dayEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  for (const ev of dayEvents) {
    const evStart = new Date(ev.startAt);
    const evEnd = new Date(ev.endAt);

    if (evStart > cursor) {
      const freeDur = Math.round((evStart.getTime() - cursor.getTime()) / (60 * 1000));
      if (freeDur > 0) {
        freeSlots.push({ start: cursor.toISOString(), end: evStart.toISOString(), durationMinutes: freeDur });
      }
    }
    busySlots.push({ start: ev.startAt, end: ev.endAt, title: ev.title });
    if (evEnd > cursor) {
      cursor = new Date(evEnd);
    }
  }

  if (cursor < workEnd) {
    const freeDur = Math.round((workEnd.getTime() - cursor.getTime()) / (60 * 1000));
    if (freeDur > 0) {
      freeSlots.push({ start: cursor.toISOString(), end: workEnd.toISOString(), durationMinutes: freeDur });
    }
  }

  const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);

  return res.json({
    date: targetDateStr,
    totalFreeMinutes,
    busySlots,
    freeSlots
  });
});

export default router;
