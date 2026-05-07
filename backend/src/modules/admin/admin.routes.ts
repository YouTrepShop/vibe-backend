import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, HttpError, ok } from '../../lib/http.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../lib/validate.js';

const r = Router();

r.use(requireAuth, requireRole('ADMIN', 'MODERATOR'));

r.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const [users, posts, chats, calls, reports, online] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.chat.count(),
      prisma.call.count(),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.user.count({ where: { isOnline: true } }),
    ]);
    return ok(res, { users, posts, chats, calls, reportsOpen: reports, online });
  }),
);

r.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string) || '';
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { fullName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return ok(res, users);
  }),
);

r.post(
  '/users/:id/suspend',
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.params.id }, data: { status: 'SUSPENDED' } });
    return ok(res, { ok: true });
  }),
);

r.post(
  '/users/:id/restore',
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
    return ok(res, { ok: true });
  }),
);

r.post(
  '/users/:id/verify',
  asyncHandler(async (req, res) => {
    const isVerified = req.body?.verified !== false;
    await prisma.user.update({ where: { id: req.params.id }, data: { isVerified } });
    return ok(res, { ok: true });
  }),
);

r.post(
  '/users/:id/role',
  validateBody(z.object({ role: z.enum(['USER', 'MODERATOR', 'ADMIN']) })),
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.params.id }, data: { role: req.body.role } });
    return ok(res, { ok: true });
  }),
);

r.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const status = (req.query.status as string) || 'OPEN';
    const reports = await prisma.report.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' },
      include: { reporter: true, subject: true },
      take: 100,
    });
    return ok(res, reports);
  }),
);

r.post(
  '/reports/:id/resolve',
  asyncHandler(async (req, res) => {
    await prisma.report.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolverId: req.user!.id },
    });
    return ok(res, { ok: true });
  }),
);

r.post(
  '/posts/:id/remove',
  asyncHandler(async (req, res) => {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) throw new HttpError(404);
    await prisma.post.delete({ where: { id: post.id } });
    return ok(res, { ok: true });
  }),
);

r.get(
  '/audit',
  asyncHandler(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return ok(res, logs);
  }),
);

export default r;
