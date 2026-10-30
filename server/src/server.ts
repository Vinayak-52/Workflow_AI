import { createApp } from './app.js';
import { ENV } from './config/env.js';

const app = createApp();

app.listen(ENV.PORT, () => {
  console.log(`[Workflow AI Server] Listening on http://localhost:${ENV.PORT}`);
  console.log(`[Workflow AI Server] Environment: ${ENV.NODE_ENV}`);
});
