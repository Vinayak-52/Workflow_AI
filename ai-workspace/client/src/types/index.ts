export interface User {
  id: string;
  username?: string;
  email: string;
  displayName: string;
  timezone: string;
  preferences: {
    theme: 'dark' | 'light' | 'system';
    timezone: string;
    workingHours: { start: string; end: string };
    breakDurationMinutes: number;
  };
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
  priorityScore: number;
  dueAt: string;
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
  taskId: string;
  title: string;
  level: 'info' | 'warning' | 'urgent' | 'critical';
  message: string;
  urgencyScore: number;
  triggerAt: string;
  isDismissed: boolean;
}

export interface DocumentRecord {
  id: string;
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
  title: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  calendarName: string;
  location?: string;
  isReadOnly: boolean;
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
  planDate: string;
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
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
