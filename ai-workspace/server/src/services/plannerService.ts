/**
 * Deterministic Daily Planner Engine
 * Member 1 (Ayantik Goswami) & Member 2 (Ankit Kumar Kunwar)
 * Aligned with 08 - AI and ML Specification.md Section 5
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { DailyPlan, PlanBlock, Task, CalendarEvent } from '../models/types.js';

interface Interval {
  start: Date;
  end: Date;
}

export class PlannerService {
  static generateDailyPlan(userId: string, targetDateStr: string): DailyPlan {
    const user = db.getUserById(userId);
    const timezone = user?.timezone || 'Asia/Kolkata';
    const workingHours = user?.preferences?.workingHours || { start: '09:00', end: '18:00' };
    const breakDurationMin = user?.preferences?.breakDurationMinutes || 15;

    // Construct start and end of work day
    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);

    const workDayStart = new Date(`${targetDateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`);
    const workDayEnd = new Date(`${targetDateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`);

    // Fetch user calendar events for the day
    const allEvents = db.getCalendarEventsByUserId(userId);
    const dayEvents = allEvents.filter(e => {
      const eDate = e.startAt.split('T')[0];
      return eDate === targetDateStr && !e.isAllDay;
    });

    // Sort events by start time
    dayEvents.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Compute free intervals
    const freeIntervals: Interval[] = [];
    let currentCursor = new Date(workDayStart);

    const blocks: PlanBlock[] = [];

    for (const ev of dayEvents) {
      const evStart = new Date(ev.startAt);
      const evEnd = new Date(ev.endAt);

      if (evStart > currentCursor) {
        freeIntervals.push({ start: new Date(currentCursor), end: new Date(evStart) });
      }

      // Add fixed calendar event reference block
      blocks.push({
        id: `block-${uuidv4().slice(0, 8)}`,
        title: ev.title,
        startAt: ev.startAt,
        endAt: ev.endAt,
        durationMinutes: Math.round((evEnd.getTime() - evStart.getTime()) / (60 * 1000)),
        kind: 'fixed_event_reference',
        reason: `Fixed commitment from ${ev.calendarName} (${ev.location || 'Online'})`
      });

      if (evEnd > currentCursor) {
        currentCursor = new Date(evEnd);
      }
    }

    if (currentCursor < workDayEnd) {
      freeIntervals.push({ start: new Date(currentCursor), end: new Date(workDayEnd) });
    }

    // Fetch active tasks for user (todo and in_progress)
    const tasks = db.getTasksByUserId(userId).filter(t => t.status !== 'done');
    
    // Sort tasks by priorityScore descending, then by dueAt ascending
    tasks.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

    const conflicts: string[] = [];
    const assumptions: string[] = [
      `Working hours standard: ${workingHours.start} to ${workingHours.end} (${timezone})`,
      `Fixed Google Calendar events take absolute scheduling precedence.`,
      `Tasks allocated sequentially by ML priority score into unbooked slots.`
    ];

    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;

    // Fit tasks into available free intervals
    let taskIdx = 0;
    for (const interval of freeIntervals) {
      let slotCursor = new Date(interval.start);
      const slotEnd = new Date(interval.end);

      while (taskIdx < tasks.length && slotCursor < slotEnd) {
        const task = tasks[taskIdx];
        const taskDuration = Math.max(15, task.estimatedMinutes || 45);
        const slotAvailableMin = Math.round((slotEnd.getTime() - slotCursor.getTime()) / (60 * 1000));

        if (slotAvailableMin >= 20) {
          const allocatedMin = Math.min(taskDuration, slotAvailableMin);
          const taskStart = new Date(slotCursor);
          const taskEnd = new Date(taskStart.getTime() + allocatedMin * 60 * 1000);

          blocks.push({
            id: `block-${uuidv4().slice(0, 8)}`,
            taskId: task.id,
            title: `Focus: ${task.title}`,
            startAt: taskStart.toISOString(),
            endAt: taskEnd.toISOString(),
            durationMinutes: allocatedMin,
            kind: 'proposed_focus',
            reason: `ML Priority: ${task.predictedPriority.toUpperCase()} (Score ${task.priorityScore}). Allocated in available unbooked slot.`
          });

          totalWorkMinutes += allocatedMin;
          slotCursor = new Date(taskEnd);

          // Add short break if time remains
          if (slotCursor < slotEnd) {
            const breakTimeMin = Math.min(breakDurationMin, Math.round((slotEnd.getTime() - slotCursor.getTime()) / (60 * 1000)));
            if (breakTimeMin >= 10) {
              const breakStart = new Date(slotCursor);
              const breakEnd = new Date(breakStart.getTime() + breakTimeMin * 60 * 1000);
              blocks.push({
                id: `block-${uuidv4().slice(0, 8)}`,
                title: 'Scheduled Recovery Break',
                startAt: breakStart.toISOString(),
                endAt: breakEnd.toISOString(),
                durationMinutes: breakTimeMin,
                kind: 'break',
                reason: 'Prevents cognitive fatigue between intense focus sessions.'
              });
              totalBreakMinutes += breakTimeMin;
              slotCursor = new Date(breakEnd);
            }
          }
          taskIdx++;
        } else {
          break; // Slot too small for a meaningful block
        }
      }
    }

    // Check for unscheduled high priority tasks
    while (taskIdx < tasks.length) {
      const unscheduled = tasks[taskIdx];
      if (unscheduled.predictedPriority === 'high' || unscheduled.userPriority === 'high') {
        conflicts.push(`Workload Warning: Could not fit high-priority task "${unscheduled.title}" (${unscheduled.estimatedMinutes}m) due to lack of free calendar time today.`);
      }
      taskIdx++;
    }

    // Sort all blocks chronologically
    blocks.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const plan: DailyPlan = {
      id: `plan-${targetDateStr}-${uuidv4().slice(0, 6)}`,
      userId,
      planDate: targetDateStr,
      timezone,
      blocks,
      totalWorkMinutes,
      totalBreakMinutes,
      conflicts,
      assumptions,
      createdAt: new Date().toISOString()
    };

    db.saveDailyPlan(plan);
    return plan;
  }
}
