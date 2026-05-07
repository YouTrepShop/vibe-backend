import { prisma } from '../../config/prisma.js';
import type { NotificationType } from '@prisma/client';
import { ioRef } from '../../sockets/io.js';

export interface CreateNotificationInput {
  userId: string;
  fromUserId?: string;
  type: NotificationType;
  referenceId?: string;
  data?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  const n = await prisma.notification.create({
    data: {
      userId: input.userId,
      fromUserId: input.fromUserId,
      type: input.type,
      referenceId: input.referenceId,
      data: (input.data as any) ?? undefined,
    },
    include: { fromUser: true },
  });
  ioRef.io?.to(`user:${input.userId}`).emit('notification:new', n);
  return n;
}
