/**
 * Unified Database Store (Firestore Schema / Local Dual-Mode Persistence)
 * Member 2: Ankit Kumar Kunwar (2360031)
 * Weeks 1-3 Milestone: Database Design & Firestore Integration
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { CONFIG } from '../config/env.js';
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

let firestoreInstance: Firestore | null = null;

function getFirestoreInstance(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  if (CONFIG.FIREBASE_PROJECT_ID && CONFIG.FIREBASE_CLIENT_EMAIL && CONFIG.FIREBASE_PRIVATE_KEY) {
    try {
      if (getApps().length === 0) {
        let formattedKey = CONFIG.FIREBASE_PRIVATE_KEY.trim();
        if ((formattedKey.startsWith('"') && formattedKey.endsWith('"')) || (formattedKey.startsWith("'") && formattedKey.endsWith("'"))) {
          formattedKey = formattedKey.slice(1, -1);
        }
        formattedKey = formattedKey.replace(/\\n/g, '\n');
        initializeApp({
          credential: cert({
            projectId: CONFIG.FIREBASE_PROJECT_ID,
            clientEmail: CONFIG.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey,
          }),
        });
      }
      firestoreInstance = getFirestore();
      console.log(`[Firebase] Connected to Firestore project: ${CONFIG.FIREBASE_PROJECT_ID}`);
      return firestoreInstance;
    } catch (e: any) {
      console.warn('[Firebase] Firestore init failed, falling back to local store:', e.message);
    }
  }
  return null;
}

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
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('users').doc(user.id).set(user, { merge: true }).catch((err: any) => console.warn('[Firebase] Sync user error:', err.message));
    }
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
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('tasks').doc(task.id).set(task, { merge: true }).catch((err: any) => console.warn('[Firebase] Sync task error:', err.message));
    }
    return task;
  }

  deleteTask(id: string, userId: string): boolean {
    const t = this.getTaskById(id, userId);
    if (!t) return false;
    delete this.data.tasks[id];
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('tasks').doc(id).delete().catch(() => {});
    }
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
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('notes').doc(note.id).set(note, { merge: true }).catch((err: any) => console.warn('[Firebase] Sync note error:', err.message));
    }
    return note;
  }

  deleteNote(id: string, userId: string): boolean {
    const n = this.getNoteById(id, userId);
    if (!n) return false;
    delete this.data.notes[id];
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('notes').doc(id).delete().catch(() => {});
    }
    return true;
  }

  // Reminders operations
  getRemindersByUserId(userId: string): Reminder[] {
    return Object.values(this.data.reminders).filter(r => r.userId === userId);
  }

  saveReminder(reminder: Reminder): Reminder {
    this.data.reminders[reminder.id] = reminder;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('reminders').doc(reminder.id).set(reminder, { merge: true }).catch((err: any) => console.warn('[Firebase] Sync reminder error:', err.message));
    }
    return reminder;
  }

  dismissReminder(id: string, userId: string): boolean {
    const r = this.data.reminders[id];
    if (r && r.userId === userId) {
      r.isDismissed = true;
      this.save();
      const fsDb = getFirestoreInstance();
      if (fsDb) {
        fsDb.collection('reminders').doc(id).set({ isDismissed: true }, { merge: true }).catch(() => {});
      }
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
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('documents').doc(doc.id).set(doc, { merge: true }).catch((err: any) => console.warn('[Firebase] Sync document error:', err.message));
    }
    return doc;
  }

  deleteDocument(id: string, userId: string): boolean {
    const doc = this.getDocumentById(id, userId);
    if (!doc) return false;
    delete this.data.documents[id];
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('documents').doc(id).delete().catch(() => {});
    }
    return true;
  }

  // Calendar Event operations
  getCalendarEventsByUserId(userId: string): CalendarEvent[] {
    return Object.values(this.data.calendarEvents).filter(e => e.userId === userId);
  }

  saveCalendarEvent(event: CalendarEvent): CalendarEvent {
    this.data.calendarEvents[event.id] = event;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('calendarEvents').doc(event.id).set(event, { merge: true }).catch((err: any) => console.warn('[Firebase] Sync event error:', err.message));
    }
    return event;
  }

  // Daily Plan operations
  getDailyPlan(userId: string, planDate: string): DailyPlan | undefined {
    const plans = Object.values(this.data.dailyPlans)
      .filter(p => p.userId === userId && p.planDate === planDate)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return plans[0];
  }

  saveDailyPlan(plan: DailyPlan): DailyPlan {
    // Purge older plans for the same user and date to guarantee a single active plan
    for (const key of Object.keys(this.data.dailyPlans)) {
      const existing = this.data.dailyPlans[key];
      if (existing.userId === plan.userId && existing.planDate === plan.planDate) {
        delete this.data.dailyPlans[key];
      }
    }
    this.data.dailyPlans[plan.id] = plan;
    this.save();
    const fsDb = getFirestoreInstance();
    if (fsDb) {
      fsDb.collection('dailyPlans').doc(plan.id).set(plan, { merge: true }).catch((err: any) => console.warn('[Firebase] Sync plan error:', err.message));
    }
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
