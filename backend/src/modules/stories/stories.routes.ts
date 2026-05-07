import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, HttpError, ok } from '../../lib/http.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import { uploadBuffer } from '../../lib/storage.js';
import { validateBody } from '../../lib/validate.js';
import { createNotification } from '../notifications/notifications.service.js';

const r = Router();

r.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    let userIds: string[] = [];
    if (req.user) {
      const follows = await prisma.follow.findMany({
        where: { followerId: req.user.id, status: 'ACCEPTED' },
        select: { followingId: true },
      });
      userIds = [...follows.map((f) => f.followingId), req.user.id];
    }

    const where = userIds.length ? { userId: { in: userIds }, expiresAt: { gt: now } } : { expiresAt: { gt: now } };

    const stories = await prisma.story.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
      take: 200,
    });

    // group by user
    const map = new Map<string, { user: any; items: any[] }>();
    for (const s of stories) {
      if (!map.has(s.userId)) map.set(s.userId, { user: s.user, items: [] });
      map.get(s.userId)!.items.push(s);
    }
    return ok(res, [...map.values()]);
  }),
);

r.post(
  '/',
  requireAuth,
  upload.single('file'),
  validateBody(z.object({ caption: z.string().max(280).optional(), music: z.string().optional() }).partial()),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file');
    const result = await uploadBuffer(req.file.buffer, {
      folder: `stories/${req.user!.id}`,
      filename: req.file.originalname,
      mime: req.file.mimetype,
    });
    const mediaType = req.file.mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE';
    const story = await prisma.story.create({
      data: {
        userId: req.user!.id,
        mediaUrl: result.url,
        thumbnail: result.thumbnail,
        mediaType,
        caption: req.body.caption,
        music: req.body.music,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return ok(res, story, 201);
  }),
);

r.post(
  '/:id/view',
  requireAuth,
  asyncHandler(async (req, res) => {
    const reaction = (req.body?.reaction as string | undefined) || null;
    const story = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!story) throw new HttpError(404);
    const existing = await prisma.storyView.findUnique({
      where: { storyId_userId: { storyId: story.id, userId: req.user!.id } },
    });
    if (!existing) {
      await prisma.$transaction([
        prisma.storyView.create({ data: { storyId: story.id, userId: req.user!.id, reaction } }),
        prisma.story.update({ where: { id: story.id }, data: { viewsCount: { increment: 1 } } }),
      ]);
      if (story.userId !== req.user!.id) {
        await createNotification({
          userId: story.userId,
          fromUserId: req.user!.id,
          type: 'STORY_VIEW',
          referenceId: story.id,
        });
      }
    } else if (reaction && reaction !== existing.reaction) {
      await prisma.storyView.update({ where: { id: existing.id }, data: { reaction } });
    }
    return ok(res, { ok: true });
  }),
);

r.get(
  '/:id/viewers',
  requireAuth,
  asyncHandler(async (req, res) => {
    const story = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!story) throw new HttpError(404);
    if (story.userId !== req.user!.id) throw new HttpError(403);
    const viewers = await prisma.storyView.findMany({
      where: { storyId: story.id },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
    return ok(res, viewers);
  }),
);

r.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const s = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!s) throw new HttpError(404);
    if (s.userId !== req.user!.id) throw new HttpError(403);
    await prisma.story.delete({ where: { id: s.id } });
    return ok(res, { deleted: true });
  }),
);

export default r;
