import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { code: 'TOO_MANY_AUTH', message: 'Too many auth attempts. Try again later.' } },
});
