import { env } from './infrastructure/config/env.js';
import { createServer } from './infrastructure/server.js';
import { logger } from './utils/logger.js';

const app = createServer();

app.listen(env.port, () => {
  logger.info({ port: env.port }, `Backend listening on http://localhost:${env.port}`);
});
