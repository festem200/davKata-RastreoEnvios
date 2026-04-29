import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { createTrackingRouter } from './routes/tracking.routes.js';

export const createServer = () => {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/tracking', createTrackingRouter());

  return app;
};
