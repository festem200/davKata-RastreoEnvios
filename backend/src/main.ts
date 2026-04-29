import { env } from './infrastructure/config/env.js';
import { logger } from './infrastructure/helpers/logger/logger.js';
import { createServer } from './infrastructure/server.js';

const app = createServer();

app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Backend listening');
});
