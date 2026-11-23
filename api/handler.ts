import { createApp } from '../ai-workspace/server/src/app.js';
import { db } from '../ai-workspace/server/src/database/store.js';
import { seedDemoData } from '../ai-workspace/server/src/database/seedData.js';

let appInstance: any = null;
let initPromise: Promise<void> | null = null;

async function ensureReady() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        // Fast race: allow up to 2 seconds for Firestore sync if configured
        await Promise.race([
          db.init(),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      } catch (err: any) {
        console.warn('[Vercel Serverless] DB init warning:', err?.message);
      }
      try {
        // Guarantee demo users and academic tasks exist even on cold ephemeral container
        await seedDemoData(false);
      } catch (seedErr: any) {
        console.warn('[Vercel Serverless] Seed warning:', seedErr?.message);
      }
    })();
  }
  await initPromise;
}

function handler(req: any, res: any) {
  return new Promise<void>((resolve, reject) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', (err: any) => {
      console.error('[Vercel Serverless] Response stream error:', err);
      resolve();
    });

    (async () => {
      try {
        await ensureReady();

        if (!appInstance) {
          appInstance = createApp();
        }

        // Normalize URL from Vercel rewrites or headers
        let targetUrl = req.url || '';
        try {
          const parsed = new URL(targetUrl, 'http://localhost');
          const vercelPath = parsed.searchParams.get('__vercel_path');
          if (vercelPath) {
            parsed.searchParams.delete('__vercel_path');
            const remainingQuery = parsed.search;
            targetUrl = '/api/' + vercelPath.replace(/^\/+/, '') + remainingQuery;
          }
        } catch (e) {}

        const matchedPath = (req.headers['x-matched-path'] as string) || (req.headers['x-invoke-path'] as string);
        if (matchedPath && matchedPath.startsWith('/api/')) {
          targetUrl = matchedPath;
        }

        if (!targetUrl.startsWith('/api/')) {
          if (targetUrl.startsWith('/v1/')) {
            targetUrl = '/api' + targetUrl;
          } else if (targetUrl === '/api' || targetUrl === '/api/') {
            targetUrl = '/api/v1/health';
          }
        }

        req.url = targetUrl;

        // Delegate to Express
        appInstance(req, res);
      } catch (err: any) {
        console.error('[Vercel Serverless] Execution error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { code: 'SERVER_ERROR', message: err?.message || 'Internal Server Error' } }));
        }
        resolve();
      }
    })();
  });
}

// Critical for Vercel: must directly assign module.exports as callable function
module.exports = handler;
module.exports.default = handler;
