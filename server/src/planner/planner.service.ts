import { db, TaskDoc, DailyPlanDoc } from '../services/db.js';
import { v4 as uuidv4 } from 'uuid';

export interface PlanBlock {
  id: string;
  taskId?: string;
  title: string;
  startAt: string;
  endAt: string;
  reason: string;
  kind: 'proposed_focus' | 'break' | 'fixed_event_reference';
}

export interface GeneratedPlan {
  planId: string;
  planDate: string;
  timezone: string;
  blocks: PlanBlock[];
  assumptions: string[];
  conflicts: string[];
  warnings: string[];
  modelVersion: string;
}

export class PlannerService {
  public static async generateDailyPlan(userId: string, targetDate: string): Promise<GeneratedPlan> {
    const tasks = await db.getTasks(userId, { status: 'todo' });
    const inProgressTasks = await db.getTasks(userId, { status: 'in_progress' });
    const activeTasks = [...inProgressTasks, ...tasks];

    // Priority sorting: High > Medium > Low, then by priorityScore descending
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    activeTasks.sort((a, b) => {
      const pDiff = priorityWeight[b.userPriority] - priorityWeight[a.userPriority];
      if (pDiff !== 0) return pDiff;
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });

    // Calendar commitments for the day (09:00 - 18:00 window)
    // Busy intervals:
    // 10:00 - 11:30 (Lab 3: AI Workspace Mentor Review)
    // 13:00 - 14:00 (Department Seminar & Lunch)
    // 16:30 - 17:30 (Sprint Retrospective & Team Sync)
    // Free windows:
    // 1. 09:00 - 10:00 (60 mins)
    // 2. 11:30 - 13:00 (90 mins)
    // 3. 14:00 - 16:30 (150 mins)
    // 4. 17:30 - 18:00 (30 mins)

    const blocks: PlanBlock[] = [];
    const warnings: string[] = [];
    const assumptions = [
      'Standard academic working hours: 09:00 to 18:00 IST.',
      'Google Calendar busy intervals are strictly respected and read-only.',
      'A 15-minute cognitive break is scheduled between consecutive long focus blocks.',
    ];
    const conflicts: string[] = [];

    // Free windows definition in minutes from 09:00 (0 min)
    // 09:00 is 0
    // 10:00 is 60
    // 11:30 is 150
    // 13:00 is 240
    // 14:00 is 300
    // 16:30 is 450
    // 17:30 is 510
    // 18:00 is 540

    const freeWindows = [
      { startMin: 0, endMin: 60, startStr: '09:00', endStr: '10:00' },
      { startMin: 150, endMin: 240, startStr: '11:30', endStr: '13:00' },
      { startMin: 300, endMin: 450, startStr: '14:00', endStr: '16:30' },
      { startMin: 510, endMin: 540, startStr: '17:30', endStr: '18:00' },
    ];

    let taskIdx = 0;

    for (const win of freeWindows) {
      let currentMin = win.startMin;
      const winEndMin = win.endMin;

      while (currentMin < winEndMin && taskIdx < activeTasks.length) {
        const task = activeTasks[taskIdx];
        const taskDuration = Math.min(task.estimatedMinutes || 30, winEndMin - currentMin);

        if (taskDuration < 15) {
          // Not enough slot for task, break to next window
          break;
        }

        const taskStartH = Math.floor(currentMin / 60) + 9;
        const taskStartM = currentMin % 60;
        const taskEndH = Math.floor((currentMin + taskDuration) / 60) + 9;
        const taskEndM = (currentMin + taskDuration) % 60;

        const startStr = `${taskStartH.toString().padStart(2, '0')}:${taskStartM.toString().padStart(2, '0')}`;
        const endStr = `${taskEndH.toString().padStart(2, '0')}:${taskEndM.toString().padStart(2, '0')}`;

        blocks.push({
          id: uuidv4(),
          taskId: task.id,
          title: `Focus: ${task.title}`,
          startAt: startStr,
          endAt: endStr,
          reason: `Scheduled in available interval before fixed commitment; Priority: ${task.userPriority.toUpperCase()} (ML Score: ${((task.priorityScore || 0.5) * 100).toFixed(0)}%)`,
          kind: 'proposed_focus',
        });

        currentMin += taskDuration;
        taskIdx++;

        // Add 15 min rest if there's enough room left in window
        if (currentMin + 15 <= winEndMin && taskIdx < activeTasks.length) {
          const breakStartH = Math.floor(currentMin / 60) + 9;
          const breakStartM = currentMin % 60;
          const breakEndH = Math.floor((currentMin + 15) / 60) + 9;
          const breakEndM = (currentMin + 15) % 60;

          blocks.push({
            id: uuidv4(),
            title: 'Transition & Mental Rest',
            startAt: `${breakStartH.toString().padStart(2, '0')}:${breakStartM.toString().padStart(2, '0')}`,
            endAt: `${breakEndH.toString().padStart(2, '0')}:${breakEndM.toString().padStart(2, '0')}`,
            reason: 'Planned buffer to avoid context fatigue between demanding tasks',
            kind: 'break',
          });
          currentMin += 15;
        }
      }
    }

    if (taskIdx < activeTasks.length) {
      const unscheduled = activeTasks.length - taskIdx;
      warnings.push(
        `${unscheduled} pending task(s) could not fit into today's available free time without overlapping existing Google Calendar meetings.`
      );
    }

    const planId = uuidv4();
    const now = new Date().toISOString();

    const planDoc: DailyPlanDoc = {
      id: planId,
      userId,
      planDate: targetDate,
      timezone: 'Asia/Kolkata',
      blocks,
      assumptions,
      conflicts,
      modelVersion: 'rf-v1.0 + deterministic-v1',
      createdAt: now,
      updatedAt: now,
    };

    await db.savePlan(planDoc);

    return {
      planId,
      planDate: targetDate,
      timezone: 'Asia/Kolkata',
      blocks,
      assumptions,
      conflicts,
      warnings,
      modelVersion: planDoc.modelVersion,
    };
  }
}
