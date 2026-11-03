/**
 * Calendar and Clock Endpoints (Read-Only)
 * Member 2: Ankit Kumar Kunwar & Member 3: Vinayak Chandra
 * Aligned with 07 - API Specification.md Section 4
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { CalendarEvent } from '../models/types.js';

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
    count: events.length
  });
});

// Create Calendar Event
router.post('/events', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      startAt,
      endAt,
      isAllDay = false,
      calendarName = 'Personal',
      eventType = 'meeting',
      location = '',
      description = '',
      color = '#3b82f6'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Event title is required.' });
    }

    const start = startAt ? new Date(startAt).toISOString() : new Date().toISOString();
    const end = endAt ? new Date(endAt).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const newEvent: CalendarEvent = {
      id: `evt-${uuidv4().slice(0, 8)}`,
      userId,
      title: title.trim(),
      startAt: start,
      endAt: end,
      isAllDay: Boolean(isAllDay),
      calendarName: calendarName || 'Personal',
      eventType: eventType || 'meeting',
      location: location || '',
      description: description || '',
      color: color || '#3b82f6',
      isReadOnly: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveCalendarEvent(newEvent);

    db.logActivity({
      id: `act-${uuidv4().slice(0, 8)}`,
      userId,
      action: 'created',
      entityType: 'calendar_event',
      entityId: saved.id,
      metadata: { title: saved.title, startAt: saved.startAt },
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ event: saved });
  } catch (err) {
    next(err);
  }
});

// Update Calendar Event
router.patch('/events/:id', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const existing = db.getCalendarEventById(id, userId);

    if (!existing) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const {
      title,
      startAt,
      endAt,
      isAllDay,
      calendarName,
      eventType,
      location,
      description,
      color
    } = req.body;

    const updated: CalendarEvent = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      startAt: startAt !== undefined ? new Date(startAt).toISOString() : existing.startAt,
      endAt: endAt !== undefined ? new Date(endAt).toISOString() : existing.endAt,
      isAllDay: isAllDay !== undefined ? Boolean(isAllDay) : existing.isAllDay,
      calendarName: calendarName !== undefined ? calendarName : existing.calendarName,
      eventType: eventType !== undefined ? eventType : existing.eventType,
      location: location !== undefined ? location : existing.location,
      description: description !== undefined ? description : existing.description,
      color: color !== undefined ? color : existing.color,
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveCalendarEvent(updated);
    return res.json({ event: saved });
  } catch (err) {
    next(err);
  }
});

// Delete Calendar Event
router.delete('/events/:id', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const success = db.deleteCalendarEvent(id, userId);

    if (!success) {
      return res.status(404).json({ error: 'Event not found or already deleted.' });
    }

    db.logActivity({
      id: `act-${uuidv4().slice(0, 8)}`,
      userId,
      action: 'deleted',
      entityType: 'calendar_event',
      entityId: id,
      metadata: {},
      createdAt: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    next(err);
  }
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
