import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { isProd } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['warn', 'error'],
  });

if (!isProd) global.__prisma = prisma;

prisma.$connect().catch((err) => {
  logger.error({ err }, 'Failed to connect to Postgres');
});
