import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, HttpError, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { createNotification } from '../notifications/notifications.service.js';

const r = Router();

r.post(
  '/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetId = req.params.userId;
    if (targetId === req.user!.id) throw new HttpError(400, 'Cannot follow yourself');
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new HttpError(404, 'User not found');

    const status = target.isPrivate ? 'PENDING' : 'ACCEPTED';

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user!.id, followingId: targetId } },
    });
    if (existing) return ok(res, { status: existing.status });

    await prisma.$transaction(async (tx) => {
      await tx.follow.create({
        data: { followerId: req.user!.id, followingId: targetId, status },
      });
      if (status === 'ACCEPTED') {
        await tx.user.update({ where: { id: targetId }, data: { followersCount: { increment: 1 } } });
        await tx.user.update({ where: { id: req.user!.id }, data: { followingCount: { increment: 1 } } });
      }
    });

    await createNotification({
      userId: targetId,
      fromUserId: req.user!.id,
      type: status === 'PENDING' ? 'FOLLOW_REQUEST' : 'FOLLOW',
      referenceId: req.user!.id,
    });

    return ok(res, { status });
  }),
);

r.delete(
  '/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetId = req.params.userId;
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user!.id, followingId: targetId } },
    });
    if (!f) return ok(res, { unfollowed: false });

    await prisma.$transaction(async (tx) => {
      await tx.follow.delete({ where: { id: f.id } });
      if (f.status === 'ACCEPTED') {
        await tx.user.update({ where: { id: targetId }, data: { followersCount: { decrement: 1 } } });
        await tx.user.update({ where: { id: req.user!.id }, data: { followingCount: { decrement: 1 } } });
      }
    });

    return ok(res, { unfollowed: true });
  }),
);

r.post(
  '/:userId/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const f = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.params.userId, followingId: req.user!.id } },
    });
    if (!f || f.status !== 'PENDING') throw new HttpError(404, 'Request not found');
    await prisma.$transaction(async (tx) => {
      await tx.follow.update({ where: { id: f.id }, data: { status: 'ACCEPTED' } });
      await tx.user.update({ where: { id: req.user!.id }, data: { followersCount: { increment: 1 } } });
      await tx.user.update({ where: { id: req.params.userId }, data: { followingCount: { increment: 1 } } });
    });
    return ok(res, { accepted: true });
  }),
);

export default r;
