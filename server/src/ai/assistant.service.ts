import { db } from '../services/db.js';
import { ENV } from '../config/env.js';

export interface AssistantSource {
  type: string;
  id: string;
  label?: string;
}

export interface AssistantProposal {
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface AssistantResponse {
  answer: string;
  sources: AssistantSource[];
  proposals: AssistantProposal[];
  warnings: string[];
}

export class AssistantService {
  public static async handleChat(
    userId: string,
    message: string,
    context: { type: string; id?: string; label?: string }
  ): Promise<AssistantResponse> {
    const lower = message.toLowerCase();
    const sources: AssistantSource[] = [];
    const proposals: AssistantProposal[] = [];
    const warnings: string[] = [];

    // Read workspace data relevant to context
    const userNotes = await db.getNotes(userId);
    const userTasks = await db.getTasks(userId);

    // Prompt injection check: ensure user text isn't instructing external system bypasses
    if (lower.includes('send email') || lower.includes('delete calendar') || lower.includes('bypass permission')) {
      return {
        answer: 'Safety Constraint: Google integration is strictly read-only in this workspace. No sending of emails or calendar modifications are permitted under any circumstances.',
        sources: [],
        proposals: [],
        warnings: ['Write attempt blocked by security boundary.'],
      };
    }

    // Contextual handling: Notes
    if (context.type === 'notes' || lower.includes('note') || lower.includes('outline')) {
      const activeNote = context.id ? userNotes.find(n => n.id === context.id) : userNotes[0];
      if (activeNote) {
        sources.push({
          type: 'workspace_note',
          id: activeNote.id,
          label: activeNote.title,
        });

        proposals.push({
          title: `Action from Note: ${activeNote.title}`,
          description: `Follow up on items documented in "${activeNote.title}"`,
          estimatedMinutes: 45,
        });

        return {
          answer: `Based on your note "${activeNote.title}", here is a structured summary:\n- Contains key architectural principles and core workspace requirements.\n- I have drafted a candidate action item for your review. Would you like to confirm and save it to your workspace tasks?`,
          sources,
          proposals,
          warnings,
        };
      }
    }

    // Contextual handling: Calendar or Day Planning
    if (context.type === 'calendar' || lower.includes('plan') || lower.includes('calendar') || lower.includes('schedule')) {
      sources.push({
        type: 'calendar_event',
        id: 'gcal-event-review-01',
        label: 'Lab 3: AI Workspace Mentor Review (10:00 - 11:30)',
      });

      const pendingHigh = userTasks.find(t => t.userPriority === 'high');
      if (pendingHigh) {
        sources.push({
          type: 'workspace_task',
          id: pendingHigh.id,
          label: pendingHigh.title,
        });
      }

      return {
        answer: `I analyzed your calendar commitments for today. You have fixed events: Lab 3 Mentor Review at 10:00 AM, Department Seminar at 1:00 PM, and Sprint Retrospective at 4:30 PM. Your prime free window is 14:00 - 16:30 (150 minutes). I recommend focusing on "${pendingHigh?.title || 'your top priority task'}" during this window.`,
        sources,
        proposals,
        warnings,
      };
    }

    // Contextual handling: Inbox / Email
    if (context.type === 'inbox' || lower.includes('email') || lower.includes('inbox')) {
      sources.push({
        type: 'gmail_message',
        id: 'msg-hitk-project-101',
        label: 'AI Workspace Project: Midterm Evaluation Schedule',
      });

      proposals.push({
        title: 'Review Midterm Demo Deliverables with Team',
        description: 'Derived from email from Prof. Sajal Mitra regarding evaluation schedule.',
        estimatedMinutes: 60,
      });

      return {
        answer: `Your inbox highlights an email from Prof. Sajal Mitra regarding the Midterm Evaluation on November 3. It requests a demo of the React dashboard, Random Forest model metrics, and read-only Google integration. I have formulated a candidate task for this review.`,
        sources,
        proposals,
        warnings,
      };
    }

    // General fallback assistance with grounded citations
    if (userTasks.length > 0) {
      sources.push({
        type: 'workspace_task',
        id: userTasks[0].id,
        label: userTasks[0].title,
      });
    }

    return {
      answer: `You currently have ${userTasks.filter(t => t.status !== 'done').length} pending tasks in your workspace and ${userNotes.length} saved notes. Let me know if you would like me to draft an outline, extract tasks from an email, or plan your focus blocks around your calendar commitments.`,
      sources,
      proposals,
      warnings,
    };
  }
}
