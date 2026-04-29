import { env } from './infrastructure/config/env.js';
import { createServer } from './infrastructure/server.js';

const app = createServer();

app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);
});
