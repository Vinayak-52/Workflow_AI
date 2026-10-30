import { db, TaskDoc } from './db.js';
import { AppError } from '../middleware/errorHandler.js';
import { MLService } from './ml.service.js';

export class TasksService {
  public static async listTasks(userId: string, filter?: { status?: string; dueBefore?: string }): Promise<TaskDoc[]> {
    return db.getTasks(userId, filter);
  }

  public static async getTask(userId: string, id: string): Promise<TaskDoc> {
    const task = await db.getTaskById(userId, id);
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }
    return task;
  }

  public static async createTask(userId: string, data: Partial<TaskDoc>): Promise<TaskDoc> {
    // If due date provided, evaluate priority via ML
    let predictedPriority: 'low' | 'medium' | 'high' = data.userPriority || 'medium';
    let priorityScore = 0.5;

    if (data.dueAt) {
      const hoursUntilDeadline = Math.max(1, (new Date(data.dueAt).getTime() - Date.now()) / (1000 * 60 * 60));
      const prediction = await MLService.predictPriority({
        hoursUntilDeadline,
        durationMinutes: data.estimatedMinutes || 30,
      });
      predictedPriority = prediction.priority;
      priorityScore = prediction.score;
    }

    return db.createTask(userId, {
      ...data,
      predictedPriority,
      priorityScore,
    });
  }

  public static async updateTask(userId: string, id: string, updates: Partial<TaskDoc>): Promise<TaskDoc> {
    const updated = await db.updateTask(userId, id, updates);
    if (!updated) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }
    return updated;
  }

  public static async deleteTask(userId: string, id: string): Promise<void> {
    const success = await db.deleteTask(userId, id);
    if (!success) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }
  }

  // Refresh task priority via Random Forest ML model (with rule fallback)
  public static async refreshPriority(userId: string, id: string): Promise<TaskDoc> {
    const task = await this.getTask(userId, id);

    let hoursUntilDeadline = 48.0;
    if (task.dueAt) {
      hoursUntilDeadline = Math.max(1, (new Date(task.dueAt).getTime() - Date.now()) / (1000 * 60 * 60));
    }

    const prediction = await MLService.predictPriority({
      hoursUntilDeadline,
      durationMinutes: task.estimatedMinutes || 30,
    });

    return this.updateTask(userId, id, {
      predictedPriority: prediction.priority,
      priorityScore: prediction.score,
    });
  }
}
