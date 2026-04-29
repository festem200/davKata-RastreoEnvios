import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { correlationIdMiddleware } from './middlewares/correlation-id.middleware.js';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware.js';
import { httpLoggerMiddleware } from './middlewares/http-logger.middleware.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createRoutesRouter } from './routes/routes.routes.js';

export const createServer = () => {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(httpLoggerMiddleware);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter());
  app.use('/api/routes', createRoutesRouter());
  app.use(errorHandlerMiddleware);

  return app;
};
