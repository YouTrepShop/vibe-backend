import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { optionalAuth } from '../../middleware/auth.js';

const r = Router();

r.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const type = String(req.query.type || 'all');
    if (!q) return ok(res, { users: [], posts: [], hashtags: [] });

    const [users, posts, hashtags] = await Promise.all([
      type === 'all' || type === 'users'
        ? prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { fullName: { contains: q, mode: 'insensitive' } },
              ],
              status: 'ACTIVE',
            },
            take: 20,
          })
        : [],
      type === 'all' || type === 'posts'
        ? prisma.post.findMany({
            where: { content: { contains: q, mode: 'insensitive' }, visibility: 'public', isArchived: false },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { user: true, media: { orderBy: { position: 'asc' } } },
          })
        : [],
      type === 'all' || type === 'hashtags'
        ? prisma.hashtag.findMany({
            where: { tag: { contains: q.replace(/^#/, '').toLowerCase() } },
            orderBy: { trendScore: 'desc' },
            take: 20,
          })
        : [],
    ]);

    return ok(res, { users, posts, hashtags });
  }),
);

r.get(
  '/trending',
  asyncHandler(async (_req, res) => {
    const [hashtags, users] = await Promise.all([
      prisma.hashtag.findMany({ orderBy: { trendScore: 'desc' }, take: 10 }),
      prisma.user.findMany({ orderBy: { followersCount: 'desc' }, take: 10, where: { status: 'ACTIVE' } }),
    ]);
    return ok(res, { hashtags, users });
  }),
);

r.get(
  '/suggested',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const exclude = req.user ? [req.user.id] : [];
    const users = await prisma.user.findMany({
      where: { id: { notIn: exclude }, status: 'ACTIVE' },
      orderBy: { followersCount: 'desc' },
      take: 10,
    });
    return ok(res, users);
  }),
);

export default r;
