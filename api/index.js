/**
 * Vercel Serverless Function Handler for Express Backend API
 */
const { createApp } = require('../ai-workspace/server/dist/app.js');
const { db } = require('../ai-workspace/server/dist/database/store.js');

let appInstance = null;
let initPromise = null;

module.exports = async (req, res) => {
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
};
