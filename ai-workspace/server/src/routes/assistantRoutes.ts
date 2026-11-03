/**
 * Contextual Assistant & Recommendation REST API
 * Member 1 (Ayantik Goswami), Member 2 (Ankit Kumar Kunwar), Member 3 (Vinayak Chandra)
 * Aligned with 07 - API Specification.md Section 7 & 08 - AI and ML Specification.md Section 4
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { MLClient } from '../services/mlClient.js';
import { PlannerService } from '../services/plannerService.js';
import { chatWithGemini, clearUserHistory, getUserHistory } from '../services/geminiService.js';
import { Task } from '../models/types.js';

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

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const completedTasks = tasks.filter(t => t.status === 'done');

    const sources: { type: string; id: string; label: string }[] = [];
    const proposals: any[] = [];
    const warnings: string[] = [];

    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      return res.json({
        answer: "Please enter a message or command (e.g. `/tasks`, `/create <title>`, `/plan`).",
        sources: [],
        proposals: [],
        warnings: []
      });
    }

    // ── 1. SLASH COMMANDS EXECUTION (/create, /update, /delete, /tasks, /plan) ───
    if (trimmedMsg.startsWith('/')) {
      const parts = trimmedMsg.slice(1).split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ').trim();

      // /create <task title>
      if (command === 'create' || command === 'add') {
        if (!args) {
          return res.json({
            answer: `⚠️ **Usage:** \`/create <task title>\`\nExample: \`/create Prepare Final Presentation Slides\``,
            sources: [],
            proposals: [],
            warnings: []
          });
        }

        let priority: 'low' | 'medium' | 'high' = 'high';
        let category: 'academic' | 'project' | 'administrative' | 'personal' = 'project';
        let title = args;

        if (title.toLowerCase().includes('--low') || title.toLowerCase().includes('low priority')) {
          priority = 'low';
          title = title.replace(/--low|low priority/gi, '').trim();
        } else if (title.toLowerCase().includes('--medium') || title.toLowerCase().includes('medium priority')) {
          priority = 'medium';
          title = title.replace(/--medium|medium priority/gi, '').trim();
        } else if (title.toLowerCase().includes('--high') || title.toLowerCase().includes('high priority')) {
          priority = 'high';
          title = title.replace(/--high|high priority/gi, '').trim();
        }

        if (title.toLowerCase().includes('lecture') || title.toLowerCase().includes('exam') || title.toLowerCase().includes('study')) {
          category = 'academic';
        }

        const newTask: Task = {
          id: `task-${uuidv4().slice(0, 8)}`,
          userId,
          title: title || 'New Workspace Task',
          description: 'Created via Slash Command: /create',
          status: 'todo',
          category,
          userPriority: priority,
          predictedPriority: priority,
          priorityScore: priority === 'high' ? 92.0 : priority === 'medium' ? 68.0 : 42.0,
          dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          estimatedMinutes: 60,
          isOverdue: false,
          dependencyCount: 0,
          sourceType: 'ai',
          sourceReference: 'AI Assistant /create',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.saveTask(newTask);

        return res.json({
          answer: `✅ **Task Created Successfully!**\n\n• **Title:** ${newTask.title}\n• **Priority:** \`${newTask.userPriority.toUpperCase()}\` (Score: ${newTask.priorityScore})\n• **Category:** \`${newTask.category}\`\n• **Deadline:** Tomorrow\n\nThe task is now live on your dashboard and synced to Firestore!`,
          sources: [{ type: 'task', id: newTask.id, label: newTask.title }],
          proposals: [{ type: 'create_task', task: newTask }],
          warnings: []
        });
      }

      // /update <task title or id> to <done|in_progress|todo|high|medium|low>
      if (command === 'update') {
        if (!args) {
          return res.json({
            answer: `⚠️ **Usage:** \`/update <task title> to <done|in_progress|todo|high>\`\nExample: \`/update Prepare Seminar 3 Slides to done\``,
            sources: [],
            proposals: [],
            warnings: []
          });
        }

        const lowerArgs = args.toLowerCase();
        let targetStatus: 'todo' | 'in_progress' | 'done' | null = null;
        let targetPriority: 'low' | 'medium' | 'high' | null = null;

        if (lowerArgs.endsWith('done')) targetStatus = 'done';
        else if (lowerArgs.endsWith('in_progress') || lowerArgs.endsWith('in progress')) targetStatus = 'in_progress';
        else if (lowerArgs.endsWith('todo')) targetStatus = 'todo';
        else if (lowerArgs.endsWith('high')) targetPriority = 'high';
        else if (lowerArgs.endsWith('medium')) targetPriority = 'medium';
        else if (lowerArgs.endsWith('low')) targetPriority = 'low';

        let taskQuery = args
          .replace(/\s+to\s+(done|in_progress|in progress|todo|high|medium|low)$/i, '')
          .replace(/\s+(done|in_progress|in progress|todo|high|medium|low)$/i, '')
          .trim();

        const match = tasks.find(t =>
          t.id.toLowerCase() === taskQuery.toLowerCase() ||
          t.title.toLowerCase().includes(taskQuery.toLowerCase())
        );

        if (!match) {
          return res.json({
            answer: `❌ Could not find a task matching **"${taskQuery}"**.\n\n**Your Active Tasks:**\n` +
              activeTasks.slice(0, 6).map(t => `• \`${t.title}\``).join('\n'),
            sources: [],
            proposals: [],
            warnings: []
          });
        }

        if (targetStatus) {
          match.status = targetStatus;
        }
        if (targetPriority) {
          match.userPriority = targetPriority;
          match.predictedPriority = targetPriority;
        }
        match.updatedAt = new Date().toISOString();
        db.saveTask(match);

        return res.json({
          answer: `✅ **Task Updated Successfully!**\n\n• **Title:** ${match.title}\n• **Status:** \`${match.status}\`\n• **Priority:** \`${match.predictedPriority || match.userPriority}\``,
          sources: [{ type: 'task', id: match.id, label: match.title }],
          proposals: [{ type: 'update_task', task: match }],
          warnings: []
        });
      }

      // /delete <task title or id>
      if (command === 'delete' || command === 'remove') {
        if (!args) {
          return res.json({
            answer: `⚠️ **Usage:** \`/delete <task title>\`\nExample: \`/delete Prepare Seminar 3 Slides\``,
            sources: [],
            proposals: [],
            warnings: []
          });
        }

        const match = tasks.find(t =>
          t.id.toLowerCase() === args.toLowerCase() ||
          t.title.toLowerCase().includes(args.toLowerCase())
        );

        if (!match) {
          return res.json({
            answer: `❌ Could not find a task matching **"${args}"**.\n\n**Your Active Tasks:**\n` +
              activeTasks.slice(0, 6).map(t => `• \`${t.title}\``).join('\n'),
            sources: [],
            proposals: [],
            warnings: []
          });
        }

        db.deleteTask(match.id, userId);

        return res.json({
          answer: `🗑️ **Task Deleted Successfully!**\n\nRemoved "**${match.title}**" from your workspace.`,
          sources: [],
          proposals: [{ type: 'delete_task', taskId: match.id }],
          warnings: []
        });
      }

      // /tasks or /list
      if (command === 'tasks' || command === 'list') {
        const sorted = [...activeTasks].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
        return res.json({
          answer: `📋 **Your Active Tasks (${sorted.length} Total):**\n\n` +
            sorted.map((t, i) => {
              const dueStr = t.dueAt ? ` (Due: ${new Date(t.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })})` : '';
              return `${i + 1}. **${t.title}**\n   • Priority: \`${(t.predictedPriority || t.userPriority || 'medium').toUpperCase()}\` [Score: ${t.priorityScore || 'N/A'}]${dueStr}`;
            }).join('\n\n'),
          sources: sorted.map(t => ({ type: 'task', id: t.id, label: t.title })),
          proposals: [],
          warnings: []
        });
      }

      // /plan
      if (command === 'plan') {
        const todayStr = new Date().toISOString().split('T')[0];
        const plan = PlannerService.generateDailyPlan(userId, todayStr);
        const focusBlocks = plan.blocks.filter(b => b.kind === 'proposed_focus');
        return res.json({
          answer: `📅 **Daily Plan for Today (${todayStr}):**\n\n` +
            `• Allocated Focus Blocks: **${focusBlocks.length}** (${plan.totalWorkMinutes} mins total)\n\n` +
            focusBlocks.map(fb => `• \`${new Date(fb.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\`: **${fb.title}**`).join('\n'),
          sources: focusBlocks.map(fb => ({ type: 'task', id: fb.taskId || '', label: fb.title })),
          proposals: [],
          warnings: plan.conflicts
        });
      }
    }

    // ── 2. NATURAL LANGUAGE TASK CREATION INTERCEPT ────────────────
    const lower = trimmedMsg.toLowerCase();
    if (lower.startsWith('create task') || lower.startsWith('add task') || lower.startsWith('new task')) {
      let rawTitle = trimmedMsg
        .replace(/^(create task|add task|new task|remind me to|please add a task to|can you add task)\s*:?/i, '')
        .trim();
      if (!rawTitle) rawTitle = 'New Workspace Task';

      let priority: 'low' | 'medium' | 'high' = 'high';
      if (lower.includes('low')) priority = 'low';
      else if (lower.includes('medium')) priority = 'medium';

      const newTask: Task = {
        id: `task-${uuidv4().slice(0, 8)}`,
        userId,
        title: rawTitle,
        description: 'Created via AI Assistant',
        status: 'todo',
        category: 'project',
        userPriority: priority,
        predictedPriority: priority,
        priorityScore: priority === 'high' ? 90.0 : priority === 'medium' ? 65.0 : 40.0,
        dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        estimatedMinutes: 60,
        isOverdue: false,
        dependencyCount: 0,
        sourceType: 'ai',
        sourceReference: 'AI Assistant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.saveTask(newTask);

      return res.json({
        answer: `✅ **Task Created Successfully!**\n\n• **Title:** ${newTask.title}\n• **Priority:** \`${newTask.userPriority.toUpperCase()}\` (Score: ${newTask.priorityScore})\n• **Due:** Tomorrow\n\nIt is now saved in your workspace and displayed on your dashboard!`,
        sources: [{ type: 'task', id: newTask.id, label: newTask.title }],
        proposals: [{ type: 'create_task', task: newTask }],
        warnings: []
      });
    }

    // ── 3. DEDICATED OPTIMIZED GEMINI FLOW WITH LIVE GROUNDING ────
    if (isGemini) {
      try {
        const geminiRes = await chatWithGemini(trimmedMsg, {
          userId,
          customHistory: Array.isArray(history) ? history : undefined,
          clearHistory: Boolean(clearHistory),
          workspaceContext: {
            userName: req.user!.displayName,
            tasks: tasks.map(t => ({
              id: t.id,
              title: t.title,
              category: t.category,
              priority: t.predictedPriority || t.userPriority || 'medium',
              priorityScore: t.priorityScore,
              status: t.status,
              dueAt: t.dueAt,
              estimatedMinutes: t.estimatedMinutes
            })),
            completedTasksCount: completedTasks.length,
            events: events.map(e => ({ title: e.title, startAt: e.startAt, endAt: e.endAt, location: e.location })),
            notes: notes.map(n => ({ id: n.id, title: n.title })),
            docs: docs.map(d => ({ id: d.id, fileName: d.fileName }))
          }
        });

        // Add grounded sources from active tasks
        const topTasks = activeTasks.slice(0, 3);
        for (const t of topTasks) {
          sources.push({ type: 'task', id: t.id, label: t.title });
        }

        return res.json({
          answer: geminiRes.answer,
          sources: [
            {
              type: 'ai_model',
              id: geminiRes.model,
              label: `Gemini (${geminiRes.tokensUsed ?? '?'} tokens | Context: ${geminiRes.historyLength}/5 prompts)`
            },
            ...sources
          ],
          proposals: [],
          warnings
        });
      } catch (geminiErr: any) {
        console.error('[AssistantChat] Gemini error:', geminiErr.message);
        // Fall back to rule-based answers if Gemini fails
      }
    }

    // ── 4. LOCAL RULE-BASED ENGINE (OFFLINE FALLBACK) ─────────────
    if (lower.includes('plan') || lower.includes('schedule') || lower.includes('today')) {
      const todayStr = new Date().toISOString().split('T')[0];
      const plan = PlannerService.generateDailyPlan(userId, todayStr);
      const focusBlocks = plan.blocks.filter(b => b.kind === 'proposed_focus');
      const fixedBlocks = plan.blocks.filter(b => b.kind === 'fixed_event_reference');

      let answer = `I have generated your daily plan for today (${todayStr}). You have ${fixedBlocks.length} fixed calendar events and ${focusBlocks.length} prioritized focus blocks scheduled around your free time.`;

      for (const ev of fixedBlocks) {
        sources.push({ type: 'calendar_event', id: ev.id, label: ev.title });
      }
      for (const fb of focusBlocks) {
        if (fb.taskId) {
          sources.push({ type: 'task', id: fb.taskId, label: fb.title });
        }
      }

      return res.json({
        answer,
        sources,
        proposals,
        warnings: plan.conflicts
      });
    }

    if (lower.includes('urgent') || lower.includes('priority') || lower.includes('deadline') || lower.includes('what to do')) {
      const highTasks = activeTasks.filter(t => t.predictedPriority === 'high' || t.userPriority === 'high');
      const sorted = [...highTasks].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

      let answer = `You currently have **${sorted.length} high-priority tasks** requiring your attention:\n\n` +
        sorted.map((t, idx) => `${idx + 1}. **${t.title}** (Priority Score: ${t.priorityScore || 90}, Due: ${t.dueAt ? new Date(t.dueAt).toLocaleDateString() : 'N/A'})`).join('\n');

      for (const t of sorted) {
        sources.push({ type: 'task', id: t.id, label: t.title });
      }

      return res.json({
        answer,
        sources,
        proposals,
        warnings
      });
    }

    // Default synthesis
    const answer = `Hello ${req.user!.displayName}! You have ${activeTasks.length} active tasks (${activeTasks.filter(t => t.predictedPriority === 'high').length} high-priority) and ${events.length} calendar commitments in your workspace. You can use slash commands like \`/tasks\`, \`/create <title>\`, \`/update <title>\`, or \`/plan\` anytime!`;

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
        description: `This task is ranked as HIGH priority by the Random Forest model (Score: ${urgentTasks[0].priorityScore || 90}). Allocate 60 min before your next meeting.`,
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
