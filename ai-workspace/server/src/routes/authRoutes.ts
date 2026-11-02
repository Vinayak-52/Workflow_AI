/**
 * Auth & User Endpoints
 * Member 2: Ankit Kumar Kunwar (2360031)
 */

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config/env.js';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { activityLogger } from '../middleware/activityLogger.js';

const router = Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;
    const identifier = (username || email || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Username and password are required' } });
    }
    const userEmail = email || `${identifier}@hitk.edu.in`;
    const existing = db.getUserByUsernameOrEmail(identifier);
    if (existing) {
      return res.status(409).json({ error: { code: 'USER_EXISTS', message: 'A user with this username already exists' } });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      username: username || identifier,
      email: userEmail,
      displayName: displayName || username || identifier,
      passwordHash,
      timezone: 'Asia/Kolkata',
      preferences: {
        theme: 'dark' as const,
        timezone: 'Asia/Kolkata',
        workingHours: { start: '09:00', end: '18:00' },
        breakDurationMinutes: 15
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.saveUser(newUser);

    const token = jwt.sign({ id: newUser.id, username: newUser.username, email: newUser.email }, CONFIG.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      user: { id: newUser.id, username: newUser.username, email: newUser.email, displayName: newUser.displayName, preferences: newUser.preferences },
      token
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Username and password required' } });
    }
    const user = db.getUserByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } });
    }

    const token = jwt.sign({ id: user.id, username: user.username || user.email }, CONFIG.JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      user: { id: user.id, username: user.username || 'vinayak', email: user.email, displayName: user.displayName, preferences: user.preferences },
      token
    });
  } catch (err) {
    next(err);
  }
});

// Current User Profile
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  return res.json({
    id: user.id,
    username: user.username || 'vinayak',
    email: user.email,
    displayName: user.displayName,
    timezone: user.timezone,
    preferences: user.preferences
  });
});

// Update Preferences
router.patch('/me/preferences', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

  user.preferences = { ...user.preferences, ...req.body };
  user.updatedAt = new Date().toISOString();
  db.saveUser(user);

  return res.json({ preferences: user.preferences });
});

// Integrations Status (Google read-only status)
router.get('/integrations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    google: {
      connected: true,
      accountEmail: req.user!.email,
      grantedScopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
      readOnlyNotice: 'All external integrations are strictly read-only. No Google write operations permitted.'
    }
  });
});

export default router;
