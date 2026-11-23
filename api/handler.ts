import { createApp } from '../ai-workspace/server/src/app.js';
import { db } from '../ai-workspace/server/src/database/store.js';

let appInstance: any = null;
let initPromise: Promise<any> | null = null;

export default async function handler(req: any, res: any) {
  if (!initPromise) {
    initPromise = db.init().catch(err => {
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
}
