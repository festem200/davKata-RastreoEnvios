import pino from 'pino';

import { env } from '../../config/env.js';

export const logger = pino({
  base: undefined,
  formatters: {
    level: (label) => ({ level: label })
  },
  level: env.logLevel,
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime
});
