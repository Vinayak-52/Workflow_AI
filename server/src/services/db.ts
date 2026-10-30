import { v4 as uuidv4 } from 'uuid';

export interface NoteDoc {
  id: string;
  userId: string;
  title: string;
  content: string;
  format: 'markdown';
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskDoc {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  userPriority: 'low' | 'medium' | 'high';
  predictedPriority: 'low' | 'medium' | 'high';
  priorityScore: number;
  dueAt: string | null;
  estimatedMinutes: number;
  sourceType: 'manual' | 'email' | 'note' | 'ai';
  sourceReference: {
    type: string;
    id: string;
    label?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface GoogleConnectionDoc {
  id: string;
  userId: string;
  googleEmail: string;
  grantedScopes: string[];
  encryptedRefreshToken: string;
  connectedAt: string;
  updatedAt: string;
  status: 'connected' | 'revoked' | 'error';
}

export interface DailyPlanDoc {
  id: string;
  userId: string;
  planDate: string;
  timezone: string;
  blocks: Array<{
    id: string;
    taskId?: string;
    title: string;
    startAt: string;
    endAt: string;
    reason: string;
    kind: 'proposed_focus' | 'break' | 'fixed_event_reference';
  }>;
  assumptions: string[];
  conflicts: string[];
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
}

// In-Memory Database Store simulating Firestore with strict per-user subcollections
class DatabaseService {
  private notes: Map<string, NoteDoc> = new Map();
  private tasks: Map<string, TaskDoc> = new Map();
  private connections: Map<string, GoogleConnectionDoc> = new Map();
  private plans: Map<string, DailyPlanDoc> = new Map();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const demoUserId = 'test-user-id';
    const now = new Date().toISOString();

    // Default sample note
    const sampleNote: NoteDoc = {
      id: 'note-welcome-01',
      userId: demoUserId,
      title: 'Welcome to Workflow AI',
      content: `# Getting Started with Workflow AI\n\nWorkflow AI unifies your notes, tasks, emails, and calendar commitments into a single calm workspace.\n\n### Key Principles:\n- **Evidence-grounded:** Every extracted task points back to its source.\n- **Human in the loop:** Google integration is strictly read-only.\n- **Focused execution:** AI drafts suggestions; you decide what to save.`,
      format: 'markdown',
      pinned: true,
      tags: ['guide', 'welcome'],
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(sampleNote.id, sampleNote);

    // Default sample tasks
    const sampleTask1: TaskDoc = {
      id: 'task-review-spec-01',
      userId: demoUserId,
      title: 'Review Product Architecture & Data Model',
      description: 'Check 05 - Technical Architecture and ensure all endpoints follow REST contracts.',
      status: 'in_progress',
      userPriority: 'high',
      predictedPriority: 'high',
      priorityScore: 0.88,
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      estimatedMinutes: 45,
      sourceType: 'manual',
      sourceReference: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    const sampleTask2: TaskDoc = {
      id: 'task-test-oauth-02',
      userId: demoUserId,
      title: 'Connect Google test account',
      description: 'Verify read-only OAuth with test account in settings.',
      status: 'todo',
      userPriority: 'medium',
      predictedPriority: 'medium',
      priorityScore: 0.55,
      dueAt: new Date(Date.now() + 172800000).toISOString(),
      estimatedMinutes: 30,
      sourceType: 'manual',
      sourceReference: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    this.tasks.set(sampleTask1.id, sampleTask1);
    this.tasks.set(sampleTask2.id, sampleTask2);
  }

  // --- Notes Operations ---
  public async getNotes(userId: string, search?: string, tag?: string): Promise<NoteDoc[]> {
    return Array.from(this.notes.values())
      .filter(n => n.userId === userId)
      .filter(n => {
        if (!search) return true;
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      })
      .filter(n => {
        if (!tag) return true;
        return n.tags.includes(tag);
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  public async getNoteById(userId: string, id: string): Promise<NoteDoc | null> {
    const note = this.notes.get(id);
    if (!note || note.userId !== userId) return null;
    return note;
  }

  public async createNote(userId: string, data: Partial<NoteDoc>): Promise<NoteDoc> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const note: NoteDoc = {
      id,
      userId,
      title: data.title || 'Untitled Note',
      content: data.content || '',
      format: 'markdown',
      pinned: !!data.pinned,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(id, note);
    return note;
  }

  public async updateNote(userId: string, id: string, updates: Partial<NoteDoc>): Promise<NoteDoc | null> {
    const existing = await this.getNoteById(userId, id);
    if (!existing) return null;

    const updated: NoteDoc = {
      ...existing,
      ...updates,
      userId, // Immutable owner
      id,     // Immutable ID
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(id, updated);
    return updated;
  }

  public async deleteNote(userId: string, id: string): Promise<boolean> {
    const existing = await this.getNoteById(userId, id);
    if (!existing) return false;
    return this.notes.delete(id);
  }

  // --- Tasks Operations ---
  public async getTasks(userId: string, filter?: { status?: string; dueBefore?: string }): Promise<TaskDoc[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.userId === userId)
      .filter(t => {
        if (!filter?.status) return true;
        return t.status === filter.status;
      })
      .filter(t => {
        if (!filter?.dueBefore) return true;
        if (!t.dueAt) return false;
        return new Date(t.dueAt) <= new Date(filter.dueBefore);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async getTaskById(userId: string, id: string): Promise<TaskDoc | null> {
    const task = this.tasks.get(id);
    if (!task || task.userId !== userId) return null;
    return task;
  }

  public async createTask(userId: string, data: Partial<TaskDoc>): Promise<TaskDoc> {
    const now = new Date().toISOString();
    const id = uuidv4();
    const priority = data.userPriority || 'medium';

    const task: TaskDoc = {
      id,
      userId,
      title: data.title || 'New Task',
      description: data.description || '',
      status: data.status || 'todo',
      userPriority: priority,
      predictedPriority: data.predictedPriority || priority,
      priorityScore: data.priorityScore !== undefined ? data.priorityScore : 0.5,
      dueAt: data.dueAt || null,
      estimatedMinutes: data.estimatedMinutes || 30,
      sourceType: data.sourceType || 'manual',
      sourceReference: data.sourceReference || null,
      createdAt: now,
      updatedAt: now,
      completedAt: data.status === 'done' ? now : null,
    };
    this.tasks.set(id, task);
    return task;
  }

  public async updateTask(userId: string, id: string, updates: Partial<TaskDoc>): Promise<TaskDoc | null> {
    const existing = await this.getTaskById(userId, id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const completedAt = updates.status === 'done' ? (existing.completedAt || now) : (updates.status ? null : existing.completedAt);

    const updated: TaskDoc = {
      ...existing,
      ...updates,
      userId,
      id,
      completedAt,
      updatedAt: now,
    };
    this.tasks.set(id, updated);
    return updated;
  }

  public async deleteTask(userId: string, id: string): Promise<boolean> {
    const existing = await this.getTaskById(userId, id);
    if (!existing) return false;
    return this.tasks.delete(id);
  }

  // --- Google Connection Store ---
  public async getGoogleConnection(userId: string): Promise<GoogleConnectionDoc | null> {
    return Array.from(this.connections.values()).find(c => c.userId === userId && c.status === 'connected') || null;
  }

  public async saveGoogleConnection(conn: GoogleConnectionDoc): Promise<void> {
    this.connections.set(conn.id, conn);
  }

  public async revokeGoogleConnection(userId: string): Promise<boolean> {
    let modified = false;
    for (const [id, c] of this.connections.entries()) {
      if (c.userId === userId) {
        c.status = 'revoked';
        c.encryptedRefreshToken = '';
        c.updatedAt = new Date().toISOString();
        this.connections.set(id, c);
        modified = true;
      }
    }
    return modified;
  }

  // --- Daily Plans Store ---
  public async getPlan(userId: string, planId: string): Promise<DailyPlanDoc | null> {
    const plan = this.plans.get(planId);
    if (!plan || plan.userId !== userId) return null;
    return plan;
  }

  public async savePlan(plan: DailyPlanDoc): Promise<void> {
    this.plans.set(plan.id, plan);
  }
}

export const db = new DatabaseService();
