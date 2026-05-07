import { Response } from 'express';
import { isProd } from '../config/env.js';

const COOKIE_NAME = 'vibe_refresh';

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export const REFRESH_COOKIE = COOKIE_NAME;
