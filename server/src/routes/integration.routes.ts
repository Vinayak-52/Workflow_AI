import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../services/db.js';
import { GOOGLE_READONLY_SCOPES } from '../integrations/google/oauth.js';

const router = Router();
router.use(requireAuth);

// GET /api/v1/integrations - List connection status & granted scopes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conn = await db.getGoogleConnection(req.userId!);
    if (!conn || conn.status !== 'connected') {
      return res.json({
        connected: false,
        email: null,
        grantedScopes: [],
        connectedAt: null,
        status: 'disconnected',
      });
    }

    // Security requirement: NEVER return the encrypted or raw refresh token to client
    res.json({
      connected: true,
      email: conn.googleEmail,
      grantedScopes: conn.grantedScopes || GOOGLE_READONLY_SCOPES,
      connectedAt: conn.connectedAt,
      status: conn.status,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/integrations/google - Disconnect & revoke credentials
router.delete('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.revokeGoogleConnection(req.userId!);
    res.json({
      success: true,
      message: 'Google connection revoked and credentials securely removed.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
