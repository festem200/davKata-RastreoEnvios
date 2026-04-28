import { env } from './config/env.js';
import { createServer } from './infrastructure/http/server.js';

const app = createServer();

app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);
});
