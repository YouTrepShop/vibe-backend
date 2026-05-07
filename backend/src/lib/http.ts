import { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message = 'Error', code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req as Request, res as Response, next)).catch(next);

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data } as any);
}

export function paginated<T>(res: Response, items: T[], cursor?: string | null) {
  return res.json({ ok: true, data: items, nextCursor: cursor ?? null } as any);
}
