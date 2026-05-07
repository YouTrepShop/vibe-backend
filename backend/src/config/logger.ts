import pino from 'pino';
import { env, isProd } from './env.js';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      },
  base: { service: 'vibe-backend', env: env.NODE_ENV },
});
