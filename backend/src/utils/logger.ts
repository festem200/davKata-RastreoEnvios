import pino from 'pino';

export const logger = pino({
  base: undefined,
  formatters: {
    level: (label) => ({ level: label })
  },
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime
});
