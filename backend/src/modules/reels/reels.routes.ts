import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, HttpError, ok } from '../../lib/http.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import { uploadBuffer } from '../../lib/storage.js';

const r = Router();

r.get(
  '/feed',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const cursor = (req.query.cursor as string) || undefined;
    const limit = Math.min(Number(req.query.limit) || 10, 30);
    const reels = await prisma.reel.findMany({
      orderBy: [{ likesCount: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: true },
    });
    let nextCursor: string | null = null;
    if (reels.length > limit) nextCursor = reels.pop()!.id;
    return ok(res, { items: reels, nextCursor });
  }),
);

r.post(
  '/',
  requireAuth,
  upload.single('video'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file');
    if (!req.file.mimetype.startsWith('video')) throw new HttpError(400, 'Video required');
    const result = await uploadBuffer(req.file.buffer, {
      folder: `reels/${req.user!.id}`,
      filename: req.file.originalname,
      mime: req.file.mimetype,
    });
    const reel = await prisma.reel.create({
      data: {
        userId: req.user!.id,
        videoUrl: result.url,
        thumbnail: result.thumbnail,
        caption: req.body.caption,
        music: req.body.music,
        duration: result.duration ?? 0,
        hashtags: typeof req.body.hashtags === 'string' ? req.body.hashtags.split(',').map((s: string) => s.trim()) : [],
      },
      include: { user: true },
    });
    return ok(res, reel, 201);
  }),
);

r.post(
  '/:id/view',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const reel = await prisma.reel.findUnique({ where: { id: req.params.id } });
    if (!reel) throw new HttpError(404);
    if (req.user) {
      await prisma.reelView.upsert({
        where: { reelId_userId: { reelId: reel.id, userId: req.user.id } },
        create: { reelId: reel.id, userId: req.user.id, watched: Number(req.body?.watched) || 0 },
        update: { watched: Number(req.body?.watched) || 0 },
      });
    }
    await prisma.reel.update({ where: { id: reel.id }, data: { viewsCount: { increment: 1 } } });
    return ok(res, { ok: true });
  }),
);

r.post(
  '/:id/like',
  requireAuth,
  asyncHandler(async (req, res) => {
    const reel = await prisma.reel.findUnique({ where: { id: req.params.id } });
    if (!reel) throw new HttpError(404);
    await prisma.reel.update({ where: { id: reel.id }, data: { likesCount: { increment: 1 } } });
    return ok(res, { liked: true });
  }),
);

r.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const r0 = await prisma.reel.findUnique({ where: { id: req.params.id } });
    if (!r0) throw new HttpError(404);
    if (r0.userId !== req.user!.id) throw new HttpError(403);
    await prisma.reel.delete({ where: { id: r0.id } });
    return ok(res, { deleted: true });
  }),
);

export default r;
