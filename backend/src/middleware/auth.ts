import { NextFunction, Request, Response } from 'express';
import { verifyAccess } from '../lib/jwt.js';
import { HttpError } from '../lib/http.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; username: string; role: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new HttpError(401, 'Missing token', 'UNAUTHENTICATED');
    const token = auth.slice(7);
    const payload = verifyAccess(token);
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch (e) {
    if (e instanceof HttpError) return next(e);
    return next(new HttpError(401, 'Invalid or expired token', 'UNAUTHENTICATED'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const payload = verifyAccess(auth.slice(7));
      req.user = { id: payload.sub, username: payload.username, role: payload.role };
    }
  } catch {
    // ignore — optional
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Unauthenticated'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden', 'FORBIDDEN'));
    next();
  };
}
