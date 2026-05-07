import { createServer } from 'node:http';
import { createApp } from './server.js';
import { createSocketServer } from './sockets/index.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();
const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`Vibe backend listening on http://localhost:${env.PORT}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
});
