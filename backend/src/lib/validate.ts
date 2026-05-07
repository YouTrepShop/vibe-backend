import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { HttpError } from './http.js';

export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', parsed.error.flatten()));
    }
    req.body = parsed.data as any;
    next();
  };

export const validateQuery =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return next(new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', parsed.error.flatten()));
    }
    req.query = parsed.data as any;
    next();
  };
