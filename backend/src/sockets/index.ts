import { Server as IOServer } from 'socket.io';
import { Server as HttpServer } from 'node:http';
import { verifyAccess } from '../lib/jwt.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { ioRef } from './io.js';
import { env } from '../config/env.js';
import { publicUser } from '../modules/users/users.dto.js';

export function createSocketServer(httpServer: HttpServer) {
  const io = new IOServer(httpServer, {
    cors: { origin: env.APP_URL, credentials: true, methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });
  ioRef.io = io;

  // auth middleware
  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth as any)?.token ||
        (socket.handshake.headers?.authorization?.toString().replace(/^Bearer\s+/i, '') ?? '');
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyAccess(token);
      (socket.data as any).user = { id: payload.sub, username: payload.username, role: payload.role };
      next();
    } catch (e) {
      logger.warn({ err: e }, 'Socket auth failed');
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId: string = (socket.data as any).user.id;
    socket.join(`user:${userId}`);

    // join all chats user is member of
    const memberships = await prisma.chatMember.findMany({ where: { userId }, select: { chatId: true } });
    for (const m of memberships) socket.join(`chat:${m.chatId}`);

    // online presence
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeenAt: new Date() } });
    const me = await prisma.user.findUnique({ where: { id: userId } });
    socket.broadcast.emit('presence:online', { userId });

    socket.on('chat:join', async (payload: any) => {
      const chatId = typeof payload === 'string' ? payload : payload?.chatId;
      if (!chatId) return;
      const m = await prisma.chatMember.findFirst({ where: { chatId, userId } });
      if (m) socket.join(`chat:${chatId}`);
    });

    socket.on('chat:typing', ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      socket.to(`chat:${chatId}`).emit('chat:typing', { chatId, userId, isTyping });
    });

    socket.on('message:read', async ({ messageId }: { messageId: string }) => {
      const msg = await prisma.message.findUnique({ where: { id: messageId } });
      if (!msg) return;
      const m = await prisma.chatMember.findFirst({ where: { chatId: msg.chatId, userId } });
      if (!m) return;
      await prisma.messageRead.upsert({
        where: { messageId_userId: { messageId, userId } },
        create: { messageId, userId },
        update: {},
      });
      io.to(`chat:${msg.chatId}`).emit('message:read', { messageId, userId, chatId: msg.chatId });
    });

    // -------- WebRTC signaling --------
    socket.on('call:invite', ({ toUserId, type }: { toUserId: string; type: 'AUDIO' | 'VIDEO' }) => {
      if (!toUserId || !me) return;
      io.to(`user:${toUserId}`).emit('call:invite', { from: publicUser(me), call: { id: 'pending', type } });
    });
    socket.on('call:accept', ({ toUserId }: { toUserId: string }) => {
      io.to(`user:${toUserId}`).emit('call:accept', { from: { id: userId } });
    });
    socket.on('call:decline', ({ toUserId }: { toUserId: string }) => {
      io.to(`user:${toUserId}`).emit('call:decline', { from: { id: userId } });
    });
    socket.on('call:hangup', ({ toUserId }: { toUserId: string }) => {
      io.to(`user:${toUserId}`).emit('call:hangup', { from: { id: userId } });
    });
    socket.on('webrtc:offer', ({ toUserId, offer }: any) => {
      io.to(`user:${toUserId}`).emit('webrtc:offer', { from: { id: userId }, offer });
    });
    socket.on('webrtc:answer', ({ toUserId, answer }: any) => {
      io.to(`user:${toUserId}`).emit('webrtc:answer', { from: { id: userId }, answer });
    });
    socket.on('webrtc:ice', ({ toUserId, candidate }: any) => {
      io.to(`user:${toUserId}`).emit('webrtc:ice', { from: { id: userId }, candidate });
    });

    socket.on('disconnect', async () => {
      await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeenAt: new Date() } });
      socket.broadcast.emit('presence:offline', { userId, lastSeenAt: new Date() });
    });
  });

  return io;
}
