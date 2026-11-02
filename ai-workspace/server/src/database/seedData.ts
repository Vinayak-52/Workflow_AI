/**
 * Demo Data Seeder for Academic Presentation & Testing
 * Member 2: Ankit Kumar Kunwar (2360031) & Member 3: Vinayak Chandra (2360035)
 */

import bcrypt from 'bcryptjs';
import { db } from './store.js';
import { Task, Note, CalendarEvent, User } from '../models/types.js';

export async function seedDemoData() {
  const existingUser = db.getUserByEmail('vinayak@hitk.edu.in');
  const userId = existingUser ? existingUser.id : 'user-hitk-vinayak-001';

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const demoUser: User = {
      id: userId,
      email: 'vinayak@hitk.edu.in',
      displayName: 'Vinayak Chandra (HITK CSBS)',
      passwordHash,
      timezone: 'Asia/Kolkata',
      preferences: {
        theme: 'dark',
        timezone: 'Asia/Kolkata',
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        breakDurationMinutes: 15
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveUser(demoUser);
  }

  // Check if tasks already exist
  const existingTasks = db.getTasksByUserId(userId);
  if (existingTasks.length === 0) {
    const now = new Date();
    
    // Seed realistic tasks
    const tasksToSeed: Partial<Task>[] = [
      {
        id: 'task-001',
        title: 'Prepare Seminar 3 Slides for Prof. Sajal Mitra',
        description: 'Complete the slide deck covering Problem Statement, Feasibility Analysis, and 3-Layer Architecture.',
        status: 'in_progress',
        category: 'academic',
        userPriority: 'high',
        predictedPriority: 'high',
        priorityScore: 92.5,
        dueAt: new Date(now.getTime() + 4 * 3600 * 1000).toISOString(),
        estimatedMinutes: 90,
        isOverdue: false,
        dependencyCount: 1,
        sourceType: 'manual'
      },
      {
        id: 'task-002',
        title: 'Evaluate Random Forest Model with ROUGE & Confusion Matrix',
        description: 'Run train_model.py, verify test accuracy > 85%, and generate classification report for Member 1.',
        status: 'todo',
        category: 'project',
        userPriority: 'high',
        predictedPriority: 'high',
        priorityScore: 88.0,
        dueAt: new Date(now.getTime() + 8 * 3600 * 1000).toISOString(),
        estimatedMinutes: 60,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: 'ai',
        sourceReference: 'Generated from AI Assistant planning recommendation'
      },
      {
        id: 'task-003',
        title: 'Submit HITK Library Due Books & Clearance Form',
        description: 'Return Pattern Recognition by Bishop and collect signed clearance receipt.',
        status: 'todo',
        category: 'administrative',
        userPriority: 'medium',
        predictedPriority: 'medium',
        priorityScore: 54.0,
        dueAt: new Date(now.getTime() + 28 * 3600 * 1000).toISOString(),
        estimatedMinutes: 45,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: 'manual'
      },
      {
        id: 'task-004',
        title: 'Literature Review on NLP Transformers (Awasthi et al., 2021)',
        description: 'Summarize extractive vs abstractive techniques for Seminar 3 report section 2.4.',
        status: 'done',
        category: 'academic',
        userPriority: 'medium',
        predictedPriority: 'medium',
        priorityScore: 61.0,
        dueAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        estimatedMinutes: 120,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: 'note',
        completedAt: new Date(now.getTime() - 12 * 3600 * 1000).toISOString()
      },
      {
        id: 'task-005',
        title: 'Setup Docker Container & Cloud Deployment Script',
        description: 'Write Dockerfile and docker-compose orchestration for Express backend and Python ML service.',
        status: 'todo',
        category: 'project',
        userPriority: 'low',
        predictedPriority: 'medium',
        priorityScore: 51.5,
        dueAt: new Date(now.getTime() + 72 * 3600 * 1000).toISOString(),
        estimatedMinutes: 90,
        isOverdue: false,
        dependencyCount: 2,
        sourceType: 'manual'
      }
    ];

    for (const t of tasksToSeed) {
      db.saveTask({
        ...t,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Task);
    }

    // Seed Notes
    const notesToSeed: Partial<Note>[] = [
      {
        id: 'note-001',
        title: 'Seminar 3 Discussion Notes with Mentor',
        content: `# Meeting Notes: Prof. Sajal Mitra Review
Date: October 2026
Location: HITK CSBS Department

### Key Decisions
1. **Separation of Responsibilities**:
   - Random Forest for task prioritization based on objective features.
   - NLP engine for extractive summarization of user documents and notes.
   - Deterministic planner for schedule slot allocation.
2. **Read-Only Scope**:
   - No external writing to Google Calendar or Gmail in the prototype.
3. **Continuous Learning**:
   - Record completion records to refine model prediction accuracy over time.
`,
        format: 'markdown',
        pinned: true,
        tags: ['academic', 'seminar', 'hitk']
      },
      {
        id: 'note-002',
        title: 'AI Workspace Architecture & Feature Ideas',
        content: `# Architecture Ideas & Milestones

- Front-End: React.js with Tailwind CSS for clean dark workspace UX.
- Back-End: Node.js Express REST API server with ownership validation.
- AI Layer: Python 3.14 Random Forest ML service and NLP summarizer.
- Cloud: Firestore NoSQL database schema with real-time sync.

### Next Steps:
- Add drag-and-drop document upload with instant summary breakdown.
- Verify Postman test suite across all CRUD endpoints.
`,
        format: 'markdown',
        pinned: false,
        tags: ['project', 'architecture']
      }
    ];

    for (const n of notesToSeed) {
      db.saveNote({
        ...n,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Note);
    }

    // Seed Calendar Events with consistent ISO string timestamps
    const todayStr = now.toISOString().split('T')[0];
    const eventsToSeed: CalendarEvent[] = [
      {
        id: 'cal-001',
        userId,
        title: 'CBS3293: Cloud & Distributed Systems Lecture',
        startAt: new Date(`${todayStr}T10:00:00+05:30`).toISOString(),
        endAt: new Date(`${todayStr}T11:30:00+05:30`).toISOString(),
        isAllDay: false,
        calendarName: 'HITK Academic Schedule',
        location: 'Room 304, Main Building',
        isReadOnly: true
      },
      {
        id: 'cal-002',
        userId,
        title: 'Project Review with Prof. Sajal Mitra',
        startAt: new Date(`${todayStr}T14:30:00+05:30`).toISOString(),
        endAt: new Date(`${todayStr}T15:30:00+05:30`).toISOString(),
        isAllDay: false,
        calendarName: 'HITK Faculty Meetings',
        location: 'Faculty Cabin 12',
        isReadOnly: true
      }
    ];

    for (const e of eventsToSeed) {
      db.saveCalendarEvent(e);
    }

    console.log('[Seed] Successfully seeded initial demo data for Vinayak Chandra!');
  }
}
