/**
 * Server Entry Point
 * Member 2: Ankit Kumar Kunwar (2360031) - AI Workspace Backend
 */

import { createApp } from './app.js';
import { CONFIG } from './config/env.js';
import { db } from './database/store.js';
import { seedDemoData } from './database/seedData.js';

async function bootstrap() {
  await db.init();
  await seedDemoData();

  const app = createApp();
  const server = app.listen(CONFIG.PORT, () => {
    console.log(`===============================================`);
    console.log(`AI Workspace Backend API Server`);
    console.log(`Department of CSBS, HITK`);
    console.log(`URL: http://localhost:${CONFIG.PORT}`);
    console.log(`Health: http://localhost:${CONFIG.PORT}/api/v1/health`);
    console.log(`===============================================`);
  });

  return server;
}

bootstrap().catch(err => {
  console.error('Failed to start AI Workspace server:', err);
  process.exit(1);
});
