/**
 * Unified Database Store (Firestore Schema / Local Dual-Mode Persistence)
 * Member 2: Ankit Kumar Kunwar (2360031)
 * Weeks 1-3 Milestone: Database Design & Firestore Integration
 */

import fs from 'fs';
import path from 'path';
import {
  User,
  Task,
  Note,
  Reminder,
  DocumentRecord,
  CalendarEvent,
  DailyPlan,
  ActivityLog
} from '../models/types.js';

interface DatabaseSchema {
  users: Record<string, User>;
  tasks: Record<string, Task>;
  notes: Record<string, Note>;
  reminders: Record<string, Reminder>;
  documents: Record<string, DocumentRecord>;
  calendarEvents: Record<string, CalendarEvent>;
  dailyPlans: Record<string, DailyPlan>;
  activityLogs: ActivityLog[];
}

class DatabaseStore {
  private filePath: string;
  private data: DatabaseSchema;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'firestore_store.json');
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error loading db file, initializing fresh store:', e);
      }
    }
    const empty: DatabaseSchema = {
      users: {},
      tasks: {},
      notes: {},
      reminders: {},
      documents: {},
      calendarEvents: {},
      dailyPlans: {},
      activityLogs: []
    };
    this.save(empty);
    return empty;
  }

  private save(dataToSave?: DatabaseSchema) {
    const d = dataToSave || this.data;
    fs.writeFileSync(this.filePath, JSON.stringify(d, null, 2), 'utf-8');
  }

  // User operations
  getUserById(id: string): User | undefined {
    return this.data.users[id];
  }

  getUserByEmail(email: string): User | undefined {
    return Object.values(this.data.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByUsernameOrEmail(identifier: string): User | undefined {
    const idLower = identifier.toLowerCase().trim();
    return Object.values(this.data.users).find(
      u => (u.username && u.username.toLowerCase() === idLower) ||
           (u.email && u.email.toLowerCase() === idLower) ||
           (idLower === 'vinayak' && (u.username === 'vinayak' || u.email.toLowerCase().includes('vinayak')))
    );
  }

  saveUser(user: User): User {
    this.data.users[user.id] = user;
    this.save();
    return user;
  }

  // Task operations
  getTasksByUserId(userId: string): Task[] {
    return Object.values(this.data.tasks).filter(t => t.userId === userId);
  }

  getTaskById(id: string, userId: string): Task | undefined {
    const t = this.data.tasks[id];
    return t && t.userId === userId ? t : undefined;
  }

  saveTask(task: Task): Task {
    this.data.tasks[task.id] = task;
    this.save();
    return task;
  }

  deleteTask(id: string, userId: string): boolean {
    const t = this.getTaskById(id, userId);
    if (!t) return false;
    delete this.data.tasks[id];
    this.save();
    return true;
  }

  // Note operations
  getNotesByUserId(userId: string): Note[] {
    return Object.values(this.data.notes).filter(n => n.userId === userId);
  }

  getNoteById(id: string, userId: string): Note | undefined {
    const n = this.data.notes[id];
    return n && n.userId === userId ? n : undefined;
  }

  saveNote(note: Note): Note {
    this.data.notes[note.id] = note;
    this.save();
    return note;
  }

  deleteNote(id: string, userId: string): boolean {
    const n = this.getNoteById(id, userId);
    if (!n) return false;
    delete this.data.notes[id];
    this.save();
    return true;
  }

  // Reminders operations
  getRemindersByUserId(userId: string): Reminder[] {
    return Object.values(this.data.reminders).filter(r => r.userId === userId);
  }

  saveReminder(reminder: Reminder): Reminder {
    this.data.reminders[reminder.id] = reminder;
    this.save();
    return reminder;
  }

  dismissReminder(id: string, userId: string): boolean {
    const r = this.data.reminders[id];
    if (r && r.userId === userId) {
      r.isDismissed = true;
      this.save();
      return true;
    }
    return false;
  }

  // Document operations
  getDocumentsByUserId(userId: string): DocumentRecord[] {
    return Object.values(this.data.documents).filter(d => d.userId === userId);
  }

  getDocumentById(id: string, userId: string): DocumentRecord | undefined {
    const doc = this.data.documents[id];
    return doc && doc.userId === userId ? doc : undefined;
  }

  saveDocument(doc: DocumentRecord): DocumentRecord {
    this.data.documents[doc.id] = doc;
    this.save();
    return doc;
  }

  deleteDocument(id: string, userId: string): boolean {
    const doc = this.getDocumentById(id, userId);
    if (!doc) return false;
    delete this.data.documents[id];
    this.save();
    return true;
  }

  // Calendar Event operations
  getCalendarEventsByUserId(userId: string): CalendarEvent[] {
    return Object.values(this.data.calendarEvents).filter(e => e.userId === userId);
  }

  saveCalendarEvent(event: CalendarEvent): CalendarEvent {
    this.data.calendarEvents[event.id] = event;
    this.save();
    return event;
  }

  // Daily Plan operations
  getDailyPlan(userId: string, planDate: string): DailyPlan | undefined {
    return Object.values(this.data.dailyPlans).find(p => p.userId === userId && p.planDate === planDate);
  }

  saveDailyPlan(plan: DailyPlan): DailyPlan {
    this.data.dailyPlans[plan.id] = plan;
    this.save();
    return plan;
  }

  // Activity Log operations
  logActivity(log: ActivityLog): void {
    this.data.activityLogs.push(log);
    // Keep last 1000 logs
    if (this.data.activityLogs.length > 1000) {
      this.data.activityLogs.shift();
    }
    this.save();
  }

  getActivityLogs(userId: string, limit: number = 50): ActivityLog[] {
    return this.data.activityLogs
      .filter(l => l.userId === userId)
      .slice(-limit)
      .reverse();
  }
}

export const db = new DatabaseStore();
