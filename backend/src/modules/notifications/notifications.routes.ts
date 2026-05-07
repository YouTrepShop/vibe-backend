import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';

const r = Router();

r.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const cursor = (req.query.cursor as string) || undefined;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const items = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { fromUser: true },
    });
    let nextCursor: string | null = null;
    if (items.length > limit) nextCursor = items.pop()!.id;
    return ok(res, { items, nextCursor });
  }),
);

r.get(
  '/unread-count',
  requireAuth,
  asyncHandler(async (req, res) => {
    const count = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
    return ok(res, { count });
  }),
);

r.post(
  '/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
    return ok(res, { ok: true });
  }),
);

r.post(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    });
    return ok(res, { ok: true });
  }),
);

export default r;
