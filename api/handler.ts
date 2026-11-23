import { createApp } from '../ai-workspace/server/src/app.js';
import { db } from '../ai-workspace/server/src/database/store.js';

let appInstance: any = null;
let initPromise: Promise<any> | null = null;

async function handler(req: any, res: any) {
  try {
    if (!initPromise) {
      // Race db.init with 3.5s timeout so cold starts never exceed Vercel's execution limits
      initPromise = Promise.race([
        db.init(),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]).catch(err => {
        console.warn('[Vercel Serverless] DB init warning:', err.message);
      });
    }
    await initPromise;

    if (!appInstance) {
      appInstance = createApp();
    }

    // Normalize route prefix if rewritten
    if (req.url && !req.url.startsWith('/api') && req.url.startsWith('/v1')) {
      req.url = '/api' + req.url;
    }

    return appInstance(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless] Request error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { message: err?.message || 'Internal Server Error' } }));
  }
}

// Critical for Vercel: must directly assign module.exports as callable function
module.exports = handler;
module.exports.default = handler;
