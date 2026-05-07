import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, HttpError, ok } from '../../lib/http.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { validateBody } from '../../lib/validate.js';
import { publicUser, sanitizeUser } from './users.dto.js';
import { upload } from '../../middleware/upload.js';
import { uploadBuffer } from '../../lib/storage.js';

const r = Router();

const updateMeSchema = z.object({
  fullName: z.string().max(80).optional(),
  bio: z.string().max(280).optional(),
  isPrivate: z.boolean().optional(),
  language: z.string().max(8).optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  socialLinks: z
    .array(z.object({ label: z.string().max(40), url: z.string().url(), position: z.number().int().min(0).max(20) }))
    .optional(),
});

r.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { socialLinks: { orderBy: { position: 'asc' } } },
    });
    if (!user) throw new HttpError(404, 'User not found');
    return ok(res, { ...sanitizeUser(user), socialLinks: user.socialLinks });
  }),
);

r.patch(
  '/me',
  requireAuth,
  validateBody(updateMeSchema),
  asyncHandler(async (req, res) => {
    const { socialLinks, ...rest } = req.body as z.infer<typeof updateMeSchema>;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: rest,
    });
    if (socialLinks) {
      await prisma.socialLink.deleteMany({ where: { userId: user.id } });
      if (socialLinks.length) {
        await prisma.socialLink.createMany({
          data: socialLinks.map((s) => ({ ...s, userId: user.id })),
        });
      }
    }
    const fresh = await prisma.user.findUnique({
      where: { id: user.id },
      include: { socialLinks: { orderBy: { position: 'asc' } } },
    });
    return ok(res, { ...sanitizeUser(fresh!), socialLinks: fresh?.socialLinks });
  }),
);

r.post(
  '/me/avatar',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file');
    const result = await uploadBuffer(req.file.buffer, {
      folder: `avatars/${req.user!.id}`,
      filename: req.file.originalname,
      mime: req.file.mimetype,
    });
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { avatarUrl: result.url } });
    return ok(res, sanitizeUser(user));
  }),
);

r.post(
  '/me/cover',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file');
    const result = await uploadBuffer(req.file.buffer, {
      folder: `covers/${req.user!.id}`,
      filename: req.file.originalname,
      mime: req.file.mimetype,
    });
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { coverUrl: result.url } });
    return ok(res, sanitizeUser(user));
  }),
);

r.get(
  '/by-username/:username',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      include: { socialLinks: { orderBy: { position: 'asc' } } },
    });
    if (!user) throw new HttpError(404, 'User not found');

    let isFollowing = false;
    let isRequested = false;
    if (req.user) {
      const f = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: req.user.id, followingId: user.id } },
      });
      isFollowing = f?.status === 'ACCEPTED';
      isRequested = f?.status === 'PENDING';
    }

    return ok(res, {
      ...publicUser(user),
      socialLinks: user.socialLinks,
      isFollowing,
      isRequested,
      isSelf: req.user?.id === user.id,
    });
  }),
);

r.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404);
    return ok(res, publicUser(user));
  }),
);

r.get(
  '/:id/followers',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const list = await prisma.follow.findMany({
      where: { followingId: req.params.id, status: 'ACCEPTED' },
      include: { follower: true },
      take: 50,
    });
    return ok(res, list.map((f) => publicUser(f.follower)));
  }),
);

r.get(
  '/:id/following',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const list = await prisma.follow.findMany({
      where: { followerId: req.params.id, status: 'ACCEPTED' },
      include: { following: true },
      take: 50,
    });
    return ok(res, list.map((f) => publicUser(f.following)));
  }),
);

export default r;
