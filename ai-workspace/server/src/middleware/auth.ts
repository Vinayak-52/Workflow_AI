/**
 * Authentication & Ownership Authorization Middleware
 * Member 2: Ankit Kumar Kunwar (2360031)
 * Weeks 2-3 Milestone: Authentication & Session Verification
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/env.js';
import { db } from '../database/store.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // Check if demo query or header is present
    const demoUser = db.getUserByEmail('vinayak@hitk.edu.in');
    if (demoUser && (req.headers['x-demo-mode'] === 'true' || process.env.NODE_ENV !== 'production')) {
      req.user = {
        id: demoUser.id,
        email: demoUser.email,
        displayName: demoUser.displayName
      };
      return next();
    }
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid',
        requestId: req.headers['x-request-id'] || 'req-err'
      }
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The authenticated user session is no longer active',
          requestId: req.headers['x-request-id'] || 'req-err'
        }
      });
    }
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    };
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired session token',
        requestId: req.headers['x-request-id'] || 'req-err'
      }
    });
  }
}
