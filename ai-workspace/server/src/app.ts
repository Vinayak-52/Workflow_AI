/**
 * Express Application Assembly
 * Member 2: Ankit Kumar Kunwar (2360031)
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import deadlineRoutes from './routes/deadlineRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Attach Request ID
  app.use((req, res, next) => {
    const reqId = (req.headers['x-request-id'] as string) || `req-${uuidv4().slice(0, 8)}`;
    res.setHeader('x-request-id', reqId);
    next();
  });

  // Health check
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'AI Workspace Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Clock endpoint (07 - API Specification.md Section 4)
  app.get('/api/v1/clock', (req, res) => {
    const tz = (req.query.timezone as string) || 'Asia/Kolkata';
    const now = new Date();
    res.json({
      now: now.toISOString(),
      timezone: tz,
      utcOffset: '+05:30',
      formattedLocal: now.toLocaleString('en-IN', { timeZone: tz })
    });
  });

  // REST API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/notes', noteRoutes);
  app.use('/api/v1/deadlines', deadlineRoutes);
  app.use('/api/v1/reminders', reminderRoutes);
  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/calendar', calendarRoutes);
  app.use('/api/v1/planner', plannerRoutes);
  app.use('/api/v1/assistant', assistantRoutes);
  app.use('/api/v1/activity', activityRoutes);
  app.use('/api/v1/ml', mlRoutes);

  // Serve static uploaded documents
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // Serve static frontend in production if built client exists
  const possibleClientPaths = [
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'ai-workspace/client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    '/app/client/dist'
  ];
  const clientDist = possibleClientPaths.find(p => fs.existsSync(p));
  if (clientDist) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 404 handler for undefined API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: `API Route ${req.originalUrl} does not exist.`,
        requestId: res.getHeader('x-request-id')
      }
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
