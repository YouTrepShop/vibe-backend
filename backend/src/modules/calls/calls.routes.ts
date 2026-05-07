import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../lib/validate.js';
import { env } from '../../config/env.js';

const r = Router();

r.get('/ice', requireAuth, (_req, res) => {
  const iceServers: any[] = [];
  for (const url of env.STUN_URLS.split(',').map((s) => s.trim()).filter(Boolean)) {
    iceServers.push({ urls: url });
  }
  if (env.TURN_URLS) {
    for (const url of env.TURN_URLS.split(',').map((s) => s.trim()).filter(Boolean)) {
      iceServers.push({ urls: url, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL });
    }
  }
  return ok(res, { iceServers });
});

r.get(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const calls = await prisma.call.findMany({
      where: { OR: [{ initiatorId: req.user!.id }, { participants: { some: { userId: req.user!.id } } }] },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { initiator: true, participants: { include: { user: true } } },
    });
    return ok(res, calls);
  }),
);

r.post(
  '/',
  requireAuth,
  validateBody(
    z.object({
      chatId: z.string().optional(),
      type: z.enum(['AUDIO', 'VIDEO', 'GROUP']).default('AUDIO'),
      participantIds: z.array(z.string()).default([]),
    }),
  ),
  asyncHandler(async (req, res) => {
    const call = await prisma.call.create({
      data: {
        chatId: req.body.chatId,
        initiatorId: req.user!.id,
        type: req.body.type,
        status: 'RINGING',
        participants: {
          create: [{ userId: req.user!.id }, ...req.body.participantIds.map((uid: string) => ({ userId: uid }))],
        },
      },
      include: { participants: true },
    });
    return ok(res, call, 201);
  }),
);

r.post(
  '/:id/end',
  requireAuth,
  asyncHandler(async (req, res) => {
    const call = await prisma.call.update({
      where: { id: req.params.id },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    if (call.startedAt) {
      const dur = Math.round(((call.endedAt?.getTime() || Date.now()) - call.startedAt.getTime()) / 1000);
      await prisma.call.update({ where: { id: call.id }, data: { durationSec: dur } });
    }
    return ok(res, { ended: true });
  }),
);

export default r;
