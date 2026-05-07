import { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../config/logger.js';
import { HttpError } from '../lib/http.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      ok: false,
      error: { code: err.code ?? 'ERROR', message: err.message, details: err.details },
    });
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
};
