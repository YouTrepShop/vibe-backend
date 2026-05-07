import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import followsRoutes from '../modules/follows/follows.routes.js';
import postsRoutes from '../modules/posts/posts.routes.js';
import storiesRoutes from '../modules/stories/stories.routes.js';
import reelsRoutes from '../modules/reels/reels.routes.js';
import chatsRoutes from '../modules/chats/chats.routes.js';
import messagesRoutes from '../modules/messages/messages.routes.js';
import callsRoutes from '../modules/calls/calls.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import searchRoutes from '../modules/search/search.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import uploadsRoutes from '../modules/uploads/uploads.routes.js';

const router = Router();

router.get('/', (_req, res) => res.json({ ok: true, service: 'vibe-backend', version: '1.0.0' }));
router.get('/health', (_req, res) => res.json({ ok: true }));

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/follows', followsRoutes);
router.use('/posts', postsRoutes);
router.use('/stories', storiesRoutes);
router.use('/reels', reelsRoutes);
router.use('/chats', chatsRoutes);
router.use('/messages', messagesRoutes);
router.use('/calls', callsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadsRoutes);

export default router;
