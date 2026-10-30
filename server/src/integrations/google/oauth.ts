import { Router, Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../config/env.js';
import { db, GoogleConnectionDoc } from '../../services/db.js';
import { encryptToken } from '../../utils/crypto.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

// In-memory CSRF state map with expiration
const pendingStates = new Map<string, { userId: string; timestamp: number }>();

export const GOOGLE_READONLY_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    ENV.GOOGLE_CLIENT_ID,
    ENV.GOOGLE_CLIENT_SECRET,
    ENV.GOOGLE_REDIRECT_URI
  );
}

// GET /api/v1/auth/google - Start OAuth Flow
router.get('/google', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || req.userId || 'test-user-id';

  // Generate cryptographic state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  pendingStates.set(state, { userId, timestamp: Date.now() });

  // Clean up states older than 10 minutes
  const now = Date.now();
  for (const [key, val] of pendingStates.entries()) {
    if (now - val.timestamp > 10 * 60 * 1000) {
      pendingStates.delete(key);
    }
  }

  // If credentials are not configured in dev, support offline mock connect
  if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
    const demoRedirect = `${ENV.GOOGLE_REDIRECT_URI}?code=mock_oauth_code_dev&state=${state}&demo=true`;
    return res.redirect(demoRedirect);
  }

  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_READONLY_SCOPES,
    state,
  });

  res.redirect(authUrl);
});

// GET /api/v1/auth/google/callback - Handle OAuth Callback
router.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const isDemo = req.query.demo === 'true';

    if (!state || !pendingStates.has(state)) {
      throw new AppError('Invalid or expired OAuth state parameter (CSRF detected)', 400, 'INVALID_OAUTH_STATE');
    }

    const { userId } = pendingStates.get(state)!;
    pendingStates.delete(state);

    let googleEmail = 'demo.student@hitk.edu';
    let refreshToken = 'mock_refresh_token_xyz_encrypted';

    if (!isDemo && ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) {
      const oauth2Client = getOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);
      refreshToken = tokens.refresh_token || 'existing_refresh_token';

      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      googleEmail = userInfo.data.email || 'user@example.com';
    }

    // Encrypt refresh token before storing
    const encrypted = encryptToken(refreshToken);
    const now = new Date().toISOString();

    const connection: GoogleConnectionDoc = {
      id: uuidv4(),
      userId,
      googleEmail,
      grantedScopes: GOOGLE_READONLY_SCOPES,
      encryptedRefreshToken: encrypted,
      connectedAt: now,
      updatedAt: now,
      status: 'connected',
    };

    await db.saveGoogleConnection(connection);

    // Redirect user back to the application Settings screen
    res.redirect(`${ENV.CLIENT_URL}`);
  } catch (err) {
    next(err);
  }
});

export default router;
