import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, HttpError, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../lib/validate.js';
import { upload } from '../../middleware/upload.js';
import { uploadBuffer } from '../../lib/storage.js';
import { ioRef } from '../../sockets/io.js';

const r = Router();

const sendSchema = z.object({
  content: z.string().max(4000).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'STICKER', 'GIF']).default('TEXT'),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE']).optional(),
  durationMs: z.number().int().optional(),
  replyToId: z.string().optional(),
});

async function ensureMember(chatId: string, userId: string) {
  const m = await prisma.chatMember.findFirst({ where: { chatId, userId } });
  if (!m) throw new HttpError(403, 'Not a member of this chat');
}

r.get(
  '/:chatId',
  requireAuth,
  asyncHandler(async (req, res) => {
    await ensureMember(req.params.chatId, req.user!.id);
    const cursor = (req.query.cursor as string) || undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const messages = await prisma.message.findMany({
      where: { chatId: req.params.chatId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { sender: true, replyTo: true },
    });
    let nextCursor: string | null = null;
    if (messages.length > limit) nextCursor = messages.pop()!.id;
    return ok(res, { items: messages.reverse(), nextCursor });
  }),
);

r.post(
  '/:chatId',
  requireAuth,
  validateBody(sendSchema),
  asyncHandler(async (req, res) => {
    await ensureMember(req.params.chatId, req.user!.id);
    const m = await prisma.message.create({
      data: {
        chatId: req.params.chatId,
        senderId: req.user!.id,
        type: req.body.type,
        content: req.body.content,
        mediaUrl: req.body.mediaUrl,
        mediaType: req.body.mediaType,
        durationMs: req.body.durationMs,
        replyToId: req.body.replyToId,
      },
      include: { sender: true, replyTo: true },
    });
    await prisma.chat.update({ where: { id: req.params.chatId }, data: { lastMessageAt: new Date() } });
    ioRef.io?.to(`chat:${req.params.chatId}`).emit('message:new', m);
    return ok(res, m, 201);
  }),
);

r.post(
  '/:chatId/upload',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file');
    await ensureMember(req.params.chatId, req.user!.id);
    const result = await uploadBuffer(req.file.buffer, {
      folder: `messages/${req.params.chatId}`,
      filename: req.file.originalname,
      mime: req.file.mimetype,
    });
    const mediaType = req.file.mimetype.startsWith('image')
      ? 'IMAGE'
      : req.file.mimetype.startsWith('video')
        ? 'VIDEO'
        : req.file.mimetype.startsWith('audio')
          ? 'AUDIO'
          : 'FILE';
    return ok(res, { url: result.url, mediaType });
  }),
);

r.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const m = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!m) throw new HttpError(404);
    if (m.senderId !== req.user!.id) throw new HttpError(403);
    await prisma.message.update({
      where: { id: m.id },
      data: { isDeleted: true, content: null, mediaUrl: null },
    });
    ioRef.io?.to(`chat:${m.chatId}`).emit('message:deleted', { id: m.id, chatId: m.chatId });
    return ok(res, { deleted: true });
  }),
);

export default r;
