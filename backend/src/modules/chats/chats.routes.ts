import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, HttpError, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../lib/validate.js';

const r = Router();

const directSchema = z.object({ userId: z.string() });
const groupSchema = z.object({
  title: z.string().min(1).max(64),
  memberIds: z.array(z.string()).min(1).max(200),
  avatarUrl: z.string().url().optional(),
});

async function findOrCreateDirect(a: string, b: string) {
  if (a === b) throw new HttpError(400, 'Cannot chat with yourself');
  // Find existing direct chat with both users
  const existing = await prisma.chat.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { members: { some: { userId: a } } },
        { members: { some: { userId: b } } },
      ],
    },
    include: { members: { include: { user: true } } },
  });
  if (existing) return existing;
  return prisma.chat.create({
    data: {
      type: 'DIRECT',
      members: { create: [{ userId: a }, { userId: b }] },
    },
    include: { members: { include: { user: true } } },
  });
}

r.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const memberships = await prisma.chatMember.findMany({
      where: { userId: req.user!.id },
      include: {
        chat: {
          include: {
            members: { include: { user: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const chats = memberships.map((m) => {
      const chat = m.chat;
      const otherMembers = chat.members.filter((cm) => cm.userId !== req.user!.id);
      const lastMessage = chat.messages[0] ?? null;
      return {
        id: chat.id,
        type: chat.type,
        title: chat.type === 'GROUP' ? chat.title : otherMembers[0]?.user.username,
        avatarUrl: chat.type === 'GROUP' ? chat.avatarUrl : otherMembers[0]?.user.avatarUrl,
        members: chat.members.map((cm) => ({
          userId: cm.userId,
          role: cm.role,
          user: {
            id: cm.user.id,
            username: cm.user.username,
            fullName: cm.user.fullName,
            avatarUrl: cm.user.avatarUrl,
            isOnline: cm.user.isOnline,
            lastSeenAt: cm.user.lastSeenAt,
          },
        })),
        lastMessage,
        lastMessageAt: chat.lastMessageAt,
        lastReadAt: m.lastReadAt,
        isMuted: m.isMuted,
      };
    });

    chats.sort((a, b) => {
      const at = a.lastMessageAt?.getTime() ?? 0;
      const bt = b.lastMessageAt?.getTime() ?? 0;
      return bt - at;
    });

    return ok(res, chats);
  }),
);

r.post(
  '/direct',
  requireAuth,
  validateBody(directSchema),
  asyncHandler(async (req, res) => {
    const chat = await findOrCreateDirect(req.user!.id, req.body.userId);
    return ok(res, chat, 201);
  }),
);

r.post(
  '/group',
  requireAuth,
  validateBody(groupSchema),
  asyncHandler(async (req, res) => {
    const memberIds = Array.from(new Set([req.user!.id, ...req.body.memberIds]));
    const chat = await prisma.chat.create({
      data: {
        type: 'GROUP',
        title: req.body.title,
        avatarUrl: req.body.avatarUrl,
        members: {
          create: memberIds.map((uid, i) => ({ userId: uid, role: i === 0 ? 'owner' : 'member' })),
        },
      },
      include: { members: { include: { user: true } } },
    });
    return ok(res, chat, 201);
  }),
);

r.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const member = await prisma.chatMember.findFirst({
      where: { chatId: req.params.id, userId: req.user!.id },
    });
    if (!member) throw new HttpError(404, 'Chat not found');
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: { members: { include: { user: true } } },
    });
    return ok(res, chat);
  }),
);

r.post(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.chatMember.updateMany({
      where: { chatId: req.params.id, userId: req.user!.id },
      data: { lastReadAt: new Date() },
    });
    return ok(res, { ok: true });
  }),
);

r.post(
  '/:id/mute',
  requireAuth,
  asyncHandler(async (req, res) => {
    const isMuted = req.body?.muted !== false;
    await prisma.chatMember.updateMany({
      where: { chatId: req.params.id, userId: req.user!.id },
      data: { isMuted },
    });
    return ok(res, { isMuted });
  }),
);

r.post(
  '/:id/pin',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.pinnedChat.upsert({
      where: { userId_chatId: { userId: req.user!.id, chatId: req.params.id } },
      create: { userId: req.user!.id, chatId: req.params.id },
      update: {},
    });
    return ok(res, { pinned: true });
  }),
);

r.post(
  '/:id/unpin',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.pinnedChat.deleteMany({ where: { userId: req.user!.id, chatId: req.params.id } });
    return ok(res, { pinned: false });
  }),
);

export default r;
