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

export interface Task {
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

export interface ClockInfo {
  now: string;
  timezone: string;
  utcOffset: string;
}

export interface GoogleIntegrationStatus {
  connected: boolean;
  email: string | null;
  grantedScopes: string[];
  connectedAt: string | null;
  status: 'connected' | 'revoked' | 'disconnected';
}

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-user-id', 'test-user-id'); // dev session user

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => request<{ status: string }>('/health'),

  // Notes
  getNotes: (q?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<{ notes: Note[] }>(`/notes${queryString}`);
  },
  getNote: (id: string) => request<{ note: Note }>(`/notes/${id}`),
  createNote: (data: Partial<Note>) => request<{ note: Note }>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateNote: (id: string, data: Partial<Note>) => request<{ note: Note }>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteNote: (id: string) => request<{ success: boolean }>(`/notes/${id}`, {
    method: 'DELETE',
  }),

  // Tasks
  getTasks: (filter?: { status?: string; dueBefore?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.dueBefore) params.set('dueBefore', filter.dueBefore);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<{ tasks: Task[] }>(`/tasks${queryString}`);
  },
  getTask: (id: string) => request<{ task: Task }>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) => request<{ task: Task }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTask: (id: string, data: Partial<Task>) => request<{ task: Task }>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteTask: (id: string) => request<{ success: boolean }>(`/tasks/${id}`, {
    method: 'DELETE',
  }),
  refreshPriority: (id: string) => request<{ task: Task }>(`/tasks/${id}/priority`, {
    method: 'POST',
  }),

  // Clock
  getClock: (timezone?: string) => {
    const q = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';
    return request<ClockInfo>(`/clock${q}`);
  },

  // Integrations & Google
  getIntegrationStatus: () => request<GoogleIntegrationStatus>('/integrations'),
  disconnectGoogle: () => request<{ success: boolean }>('/integrations/google', { method: 'DELETE' }),
};
