import express, { Express } from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ENV } from './config/env.js';

import healthRoutes from './routes/health.routes.js';
import notesRoutes from './routes/notes.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import clockRoutes from './routes/clock.routes.js';
import integrationRoutes from './routes/integration.routes.js';
import googleAuthRoutes from './integrations/google/oauth.js';
import gmailRoutes from './integrations/google/gmail.service.js';
import calendarRoutes from './integrations/google/calendar.service.js';
import plannerRoutes from './routes/planner.routes.js';
import assistantRoutes from './routes/assistant.routes.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(requestLogger);

  // Mount API v1 Routes
  app.use('/api/v1', healthRoutes);
  app.use('/api/v1', clockRoutes);
  app.use('/api/v1/auth', googleAuthRoutes);
  app.use('/api/v1/integrations', integrationRoutes);
  app.use('/api/v1/notes', notesRoutes);
  app.use('/api/v1/tasks', tasksRoutes);
  app.use('/api/v1/gmail', gmailRoutes);
  app.use('/api/v1/calendar', calendarRoutes);
  app.use('/api/v1/planner', plannerRoutes);
  app.use('/api/v1/assistant', assistantRoutes);

  // 404 handler for undefined API routes
  app.use('/api/v1/*', (req, res) => {
    res.status(404).json({
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: `API route ${req.method} ${req.originalUrl} does not exist.`,
        requestId: (req as any).requestId || 'none',
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
