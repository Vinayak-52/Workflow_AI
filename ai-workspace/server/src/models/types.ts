/**
 * Data Model Type Definitions
 * Member 2: Ankit Kumar Kunwar (2360031)
 * Aligned with 06 - Data Model.md and 07 - API Specification.md
 */

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  timezone: string;
  workingHours: {
    start: string; // e.g., "09:00"
    end: string;   // e.g., "18:00"
  };
  breakDurationMinutes: number;
}

export interface User {
  id: string;
  username?: string;
  email: string;
  displayName: string;
  passwordHash: string;
  timezone: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'academic' | 'project' | 'administrative' | 'personal';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  userPriority: TaskPriority;
  predictedPriority: TaskPriority;
  priorityScore: number; // 0 - 100
  dueAt: string; // ISO 8601
  estimatedMinutes: number;
  isOverdue: boolean;
  dependencyCount: number;
  sourceType: 'manual' | 'email' | 'note' | 'ai';
  sourceReference?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Note {
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

export interface Reminder {
  id: string;
  userId: string;
  taskId: string;
  title: string;
  level: 'info' | 'warning' | 'urgent' | 'critical';
  message: string;
  urgencyScore: number;
  triggerAt: string;
  isDismissed: boolean;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string;
  summary?: string;
  keyTakeaways?: string[];
  factualityScore?: number;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
  isAllDay: boolean;
  calendarName: string;
  location?: string;
  description?: string;
  color?: string;
  isReadOnly: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanBlock {
  id: string;
  taskId?: string;
  title: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  kind: 'proposed_focus' | 'break' | 'fixed_event_reference';
  reason: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  planDate: string; // YYYY-MM-DD
  timezone: string;
  blocks: PlanBlock[];
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  conflicts: string[];
  assumptions: string[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'task' | 'note' | 'document' | 'reminder' | 'plan' | 'auth' | 'calendar_event';
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
