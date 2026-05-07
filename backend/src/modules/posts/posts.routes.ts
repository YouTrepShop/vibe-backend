import { Router } from 'express';
import { PostsService } from './posts.service.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../lib/validate.js';
import { commentSchema, createPostSchema, feedQuerySchema } from './posts.schemas.js';
import { upload } from '../../middleware/upload.js';
import { uploadBuffer } from '../../lib/storage.js';

const r = Router();

r.get(
  '/feed',
  optionalAuth,
  validateQuery(feedQuerySchema),
  asyncHandler(async (req, res) => {
    const q = req.query as any;
    const result = await PostsService.feed(req.user?.id ?? null, q.scope, q.cursor, q.limit);
    return ok(res, result);
  }),
);

r.get(
  '/saved',
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await (await import('../../config/prisma.js')).prisma.savedPost.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { post: { include: { user: true, media: { orderBy: { position: 'asc' } } } } },
      take: 100,
    });
    return ok(res, items.map((s) => ({ ...s.post, liked: false, saved: true })));
  }),
);

r.get(
  '/user/:userId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const items = await (await import('../../config/prisma.js')).prisma.post.findMany({
      where: { userId: req.params.userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
      include: { user: true, media: { orderBy: { position: 'asc' } } },
      take: 50,
    });
    return ok(res, items);
  }),
);

r.post(
  '/',
  requireAuth,
  validateBody(createPostSchema),
  asyncHandler(async (req, res) => {
    const post = await PostsService.create(req.user!.id, req.body);
    return ok(res, post, 201);
  }),
);

r.post(
  '/upload',
  requireAuth,
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const uploaded = await Promise.all(
      files.map((f) =>
        uploadBuffer(f.buffer, { folder: `posts/${req.user!.id}`, filename: f.originalname, mime: f.mimetype }).then(
          (r) => ({
            url: r.url,
            thumbnail: r.thumbnail,
            type: f.mimetype.startsWith('video') ? 'VIDEO' : f.mimetype.startsWith('audio') ? 'AUDIO' : 'IMAGE',
            width: r.width,
            height: r.height,
            duration: r.duration,
          }),
        ),
      ),
    );
    return ok(res, { media: uploaded });
  }),
);

r.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const p = await PostsService.byId(req.params.id, req.user?.id);
    return ok(res, p);
  }),
);

r.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await PostsService.delete(req.user!.id, req.params.id);
    return ok(res, { deleted: true });
  }),
);

r.post(
  '/:id/like',
  requireAuth,
  asyncHandler(async (req, res) => ok(res, await PostsService.like(req.user!.id, req.params.id))),
);

r.post(
  '/:id/unlike',
  requireAuth,
  asyncHandler(async (req, res) => ok(res, await PostsService.unlike(req.user!.id, req.params.id))),
);

r.post(
  '/:id/save',
  requireAuth,
  asyncHandler(async (req, res) => ok(res, await PostsService.save(req.user!.id, req.params.id))),
);

r.post(
  '/:id/unsave',
  requireAuth,
  asyncHandler(async (req, res) => ok(res, await PostsService.unsave(req.user!.id, req.params.id))),
);

r.get(
  '/:id/comments',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const cursor = (req.query.cursor as string) || undefined;
    const limit = Number(req.query.limit) || 30;
    const result = await PostsService.listComments(req.params.id, cursor, limit);
    return ok(res, result);
  }),
);

r.post(
  '/:id/comments',
  requireAuth,
  validateBody(commentSchema),
  asyncHandler(async (req, res) => {
    const c = await PostsService.addComment(req.user!.id, req.params.id, req.body.content, req.body.parentId);
    return ok(res, c, 201);
  }),
);

r.delete(
  '/comments/:commentId',
  requireAuth,
  asyncHandler(async (req, res) => {
    await PostsService.deleteComment(req.user!.id, req.params.commentId);
    return ok(res, { deleted: true });
  }),
);

export default r;
