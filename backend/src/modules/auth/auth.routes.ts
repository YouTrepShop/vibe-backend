import { Router } from 'express';
import { AuthService } from './auth.service.js';
import { validateBody } from '../../lib/validate.js';
import {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  verifyEmailSchema,
  enable2faSchema,
} from './auth.schemas.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } from '../../lib/cookies.js';
import { requireAuth } from '../../middleware/auth.js';
import { sanitizeUser } from '../users/users.dto.js';

const r = Router();

r.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await AuthService.register(req.body);
    setRefreshCookie(res, result.refreshToken);
    return ok(res, { user: sanitizeUser(result.user), accessToken: result.accessToken }, 201);
  }),
);

r.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body, {
      ua: req.headers['user-agent'] as string,
      ip: req.ip,
    });
    setRefreshCookie(res, result.refreshToken);
    return ok(res, { user: sanitizeUser(result.user), accessToken: result.accessToken });
  }),
);

r.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    const result = await AuthService.refresh(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    return ok(res, { user: sanitizeUser(result.user), accessToken: result.accessToken });
  }),
);

r.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    await AuthService.logout(refreshToken);
    clearRefreshCookie(res);
    return ok(res, { ok: true });
  }),
);

r.post(
  '/verify-email',
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    await AuthService.verifyEmail(req.body.token);
    return ok(res, { verified: true });
  }),
);

r.post(
  '/forgot',
  authLimiter,
  validateBody(forgotSchema),
  asyncHandler(async (req, res) => {
    await AuthService.forgotPassword(req.body.email);
    return ok(res, { sent: true });
  }),
);

r.post(
  '/reset',
  authLimiter,
  validateBody(resetSchema),
  asyncHandler(async (req, res) => {
    await AuthService.resetPassword(req.body.token, req.body.password);
    return ok(res, { reset: true });
  }),
);

r.post(
  '/2fa/start',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await AuthService.start2fa(req.user!.id, req.user!.username);
    return ok(res, result);
  }),
);

r.post(
  '/2fa/enable',
  requireAuth,
  validateBody(enable2faSchema),
  asyncHandler(async (req, res) => {
    await AuthService.enable2fa(req.user!.id, req.body.token);
    return ok(res, { enabled: true });
  }),
);

r.post(
  '/2fa/disable',
  requireAuth,
  asyncHandler(async (req, res) => {
    await AuthService.disable2fa(req.user!.id);
    return ok(res, { enabled: false });
  }),
);

// OAuth stubs — return 501 with TODO so frontend can degrade gracefully
r.get('/oauth/google', (_req, res) =>
  res.status(501).json({ ok: false, error: { code: 'NOT_IMPLEMENTED', message: 'Configure GOOGLE_CLIENT_ID' } }),
);
r.get('/oauth/apple', (_req, res) =>
  res.status(501).json({ ok: false, error: { code: 'NOT_IMPLEMENTED', message: 'Configure APPLE_CLIENT_ID' } }),
);

export default r;
