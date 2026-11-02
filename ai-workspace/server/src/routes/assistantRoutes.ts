/**
 * Contextual Assistant & Recommendation REST API
 * Member 1 (Ayantik Goswami), Member 2 (Ankit Kumar Kunwar), Member 3 (Vinayak Chandra)
 * Aligned with 07 - API Specification.md Section 7 & 08 - AI and ML Specification.md Section 4
 */

import { Router, Response } from 'express';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { MLClient } from '../services/mlClient.js';
import { PlannerService } from '../services/plannerService.js';
import { chatWithGemini, clearUserHistory, getUserHistory } from '../services/geminiService.js';

const router = Router();
router.use(authMiddleware);

// Clear conversation context window
router.post('/context/clear', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  clearUserHistory(userId);
  return res.json({ success: true, message: 'Context window reset to 0 prompts.' });
});

// Get current conversation context length
router.get('/context/status', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const history = getUserHistory(userId);
  const promptCount = history.filter(m => m.role === 'user').length;
  return res.json({ promptCount, maxPrompts: 5 });
});

router.post('/chat', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const {
      message = '',
      context = { type: 'global', id: null },
      history,
      clearHistory = false
    } = req.body;

    const model = req.body.model || context?.model || 'Gemini 2.0 Flash';
    const isGemini = String(model).toLowerCase().includes('gemini');

    const tasks = db.getTasksByUserId(userId);
    const notes = db.getNotesByUserId(userId);
    const events = db.getCalendarEventsByUserId(userId);
    const docs = db.getDocumentsByUserId(userId);

    const sources: { type: string; id: string; label: string }[] = [];
    const proposals: any[] = [];
    const warnings: string[] = [];
    let answer = '';

    // ── Dedicated Optimized Gemini 2.0 Flash Flow ────────────────────
    // Fast-path execution with 5-prompt context window & zero canned greeting
    if (isGemini) {
      try {
        const geminiRes = await chatWithGemini(message, {
          userId,
          customHistory: Array.isArray(history) ? history : undefined,
          clearHistory: Boolean(clearHistory)
        });

        answer = geminiRes.answer;
        sources.push({
          type: 'ai_model',
          id: geminiRes.model,
          label: `Gemini (${geminiRes.tokensUsed ?? '?'} tokens | Context: ${geminiRes.historyLength}/5 prompts)`
        });
      } catch (geminiErr: any) {
        console.error('[AssistantChat] Gemini error:', geminiErr.message);
        answer = `Unable to generate Gemini response: ${geminiErr.message}. Please check your network connection and GEMINI_API_KEY.`;
      }

      return res.json({
        answer,
        sources,
        proposals,
        warnings
      });
    }

    // ── Non-Gemini Flow (Rule-based & Fallback with Default Phrase) ───
    const lower = message.toLowerCase();

    if (lower.includes('plan') || lower.includes('schedule') || lower.includes('today')) {
      const todayStr = new Date().toISOString().split('T')[0];
      const plan = PlannerService.generateDailyPlan(userId, todayStr);

      const focusBlocks = plan.blocks.filter(b => b.kind === 'proposed_focus');
      const fixedBlocks = plan.blocks.filter(b => b.kind === 'fixed_event_reference');

      answer = `I have generated your daily plan for today (${todayStr}). You have ${fixedBlocks.length} fixed calendar events and ${focusBlocks.length} prioritized focus blocks scheduled around your free time.`;

      for (const ev of fixedBlocks) {
        sources.push({ type: 'calendar_event', id: ev.id, label: ev.title });
      }
      for (const fb of focusBlocks) {
        if (fb.taskId) {
          sources.push({ type: 'task', id: fb.taskId, label: fb.title });
        }
      }

      if (plan.conflicts.length > 0) {
        warnings.push(...plan.conflicts);
      }
    } else if (context.type === 'note' && context.id) {
      const note = db.getNoteById(context.id, userId);
      if (note) {
        sources.push({ type: 'note', id: note.id, label: note.title });
        const sumResult = await MLClient.summarize(note.content, 3);
        answer = `Regarding your note "${note.title}":\n\nSummary:\n${sumResult.summary}\n\nKey Takeaways:\n${(sumResult.key_takeaways || []).map((t: string) => `• ${t}`).join('\n')}`;

        if (sumResult.action_items && sumResult.action_items.length > 0) {
          for (const item of sumResult.action_items) {
            proposals.push({
              type: 'create_task',
              title: item.action,
              category: 'project',
              userPriority: 'medium',
              sourceType: 'note',
              sourceReference: `Note: ${note.title}`
            });
          }
        }
      } else {
        answer = `I couldn't locate the active note in your workspace.`;
      }
    } else if (lower.includes('urgent') || lower.includes('priority') || lower.includes('deadline')) {
      const activeTasks = tasks.filter(t => t.status !== 'done');
      const highTasks = activeTasks.filter(t => t.predictedPriority === 'high' || t.userPriority === 'high');

      answer = `You currently have ${highTasks.length} high-priority tasks requiring your attention:\n` +
        highTasks.map((t, idx) => `${idx + 1}. **${t.title}** (Priority Score: ${t.priorityScore}, Due: ${new Date(t.dueAt).toLocaleTimeString()})`).join('\n');

      for (const t of highTasks) {
        sources.push({ type: 'task', id: t.id, label: t.title });
      }
    } else {
      // General workspace synthesis (Default phrase preserved for non-Gemini models)
      const activeCount = tasks.filter(t => t.status !== 'done').length;
      answer = `Hello ${req.user!.displayName}! You have ${activeCount} active tasks, ${events.length} calendar commitments, ${notes.length} notes, and ${docs.length} uploaded documents in your workspace. How can I assist you with planning or summarizing your work?`;
    }

    return res.json({
      answer,
      sources,
      proposals,
      warnings
    });
  } catch (err) {
    next(err);
  }
});

// Get Recommendation Feed (Member 3 Week 6)
router.get('/recommendations', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const tasks = db.getTasksByUserId(userId).filter(t => t.status !== 'done');
    const events = db.getCalendarEventsByUserId(userId);

    const now = new Date();
    const urgentTasks = tasks.filter(t => {
      const hours = (new Date(t.dueAt).getTime() - now.getTime()) / (3600 * 1000);
      return hours < 24 || t.predictedPriority === 'high';
    });

    const recommendations = [];

    if (urgentTasks.length > 0) {
      recommendations.push({
        id: 'rec-01',
        type: 'priority_focus',
        title: `Imminent Focus: ${urgentTasks[0].title}`,
        description: `This task is ranked as HIGH priority by the Random Forest model (Score: ${urgentTasks[0].priorityScore}). Allocate 60 min before your next meeting.`,
        actionType: 'start_task',
        taskId: urgentTasks[0].id
      });
    }

    const feedbackStats = await MLClient.getFeedbackStats();
    if (feedbackStats && feedbackStats.total_feedback_events > 0) {
      recommendations.push({
        id: 'rec-02',
        type: 'continuous_learning',
        title: 'Model Adaptation Active',
        description: `Based on your completion history (${feedbackStats.total_feedback_events} verified events), priority predictions are automatically personalized.`,
        actionType: 'info'
      });
    }

    return res.json({ recommendations });
  } catch (err) {
    next(err);
  }
});

export default router;
