import { db, NoteDoc } from './db.js';
import { AppError } from '../middleware/errorHandler.js';

export class NotesService {
  public static async listNotes(userId: string, search?: string, tag?: string): Promise<NoteDoc[]> {
    return db.getNotes(userId, search, tag);
  }

  public static async getNote(userId: string, id: string): Promise<NoteDoc> {
    const note = await db.getNoteById(userId, id);
    if (!note) {
      throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }
    return note;
  }

  public static async createNote(userId: string, data: { title?: string; content?: string; pinned?: boolean; tags?: string[] }): Promise<NoteDoc> {
    return db.createNote(userId, data);
  }

  public static async updateNote(
    userId: string,
    id: string,
    data: { title?: string; content?: string; pinned?: boolean; tags?: string[] }
  ): Promise<NoteDoc> {
    const updated = await db.updateNote(userId, id, data);
    if (!updated) {
      throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }
    return updated;
  }

  public static async deleteNote(userId: string, id: string): Promise<void> {
    const success = await db.deleteNote(userId, id);
    if (!success) {
      throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }
  }
}
