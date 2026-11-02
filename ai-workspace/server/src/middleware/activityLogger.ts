/**
 * Activity Audit Logging Middleware
 * Member 2: Ankit Kumar Kunwar (2360031)
 * Week 6 Milestone: Activity logging, validation, and error handling
 */

import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from './auth.js';
import { db } from '../database/store.js';

export function activityLogger(entityType: 'task' | 'note' | 'document' | 'reminder' | 'plan' | 'auth', action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Record original send to capture entity ID on completion
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = body?.id || body?.task?.id || body?.note?.id || req.params?.id || 'entity-action';
        try {
          db.logActivity({
            id: `act-${uuidv4().slice(0, 8)}`,
            userId: req.user.id,
            action,
            entityType,
            entityId,
            metadata: {
              method: req.method,
              path: req.originalUrl,
              title: body?.title || body?.task?.title || body?.fileName
            },
            createdAt: new Date().toISOString()
          });
        } catch (e) {
          console.error('Failed to log activity:', e);
        }
      }
      return originalJson(body);
    };

    next();
  };
}
