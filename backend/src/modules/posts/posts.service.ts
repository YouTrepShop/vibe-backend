import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../lib/http.js';
import { extractHashtags, extractMentions } from '../utils/text.js';
import { createNotification } from '../notifications/notifications.service.js';

export interface CreatePostInput {
  content?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  visibility?: 'public' | 'followers' | 'private';
  hashtags?: string[];
  mentions?: string[];
  media?: Array<{ url: string; thumbnail?: string; type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE'; width?: number; height?: number; duration?: number }>;
}

export const PostsService = {
  async create(userId: string, input: CreatePostInput) {
    const content = input.content ?? '';
    const tags = Array.from(new Set([...(input.hashtags ?? []), ...extractHashtags(content)]));
    const mentions = Array.from(new Set([...(input.mentions ?? []), ...extractMentions(content)]));

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          userId,
          content,
          type: input.type ?? (input.media?.length ? (input.media.length > 1 ? 'CAROUSEL' : input.media[0]!.type === 'VIDEO' ? 'VIDEO' : 'IMAGE') : 'TEXT'),
          visibility: input.visibility ?? 'public',
          hashtags: tags,
          mentions,
          media: input.media?.length
            ? {
                create: input.media.map((m, i) => ({ ...m, position: i })),
              }
            : undefined,
        },
        include: { media: true, user: true },
      });

      await tx.user.update({ where: { id: userId }, data: { postsCount: { increment: 1 } } });

      // upsert hashtag stats
      for (const tag of tags) {
        await tx.hashtag.upsert({
          where: { tag },
          update: { postsCount: { increment: 1 }, trendScore: { increment: 1 } },
          create: { tag, postsCount: 1, trendScore: 1 },
        });
      }
      return created;
    });

    // notify mentions
    for (const username of mentions) {
      const u = await prisma.user.findUnique({ where: { username } });
      if (u && u.id !== userId) {
        await createNotification({ userId: u.id, fromUserId: userId, type: 'MENTION', referenceId: post.id });
      }
    }

    return post;
  },

  async delete(userId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new HttpError(404, 'Post not found');
    if (post.userId !== userId) throw new HttpError(403, 'Not your post');
    await prisma.$transaction([
      prisma.post.delete({ where: { id: postId } }),
      prisma.user.update({ where: { id: userId }, data: { postsCount: { decrement: 1 } } }),
    ]);
  },

  async like(userId: string, postId: string) {
    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
    if (existing) return { liked: true };
    await prisma.$transaction([
      prisma.like.create({ data: { userId, postId } }),
      prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
    ]);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (post && post.userId !== userId) {
      await createNotification({ userId: post.userId, fromUserId: userId, type: 'LIKE', referenceId: postId });
    }
    return { liked: true };
  },

  async unlike(userId: string, postId: string) {
    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
    if (!existing) return { liked: false };
    await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
    ]);
    return { liked: false };
  },

  async save(userId: string, postId: string) {
    const existing = await prisma.savedPost.findUnique({ where: { userId_postId: { userId, postId } } });
    if (existing) return { saved: true };
    await prisma.$transaction([
      prisma.savedPost.create({ data: { userId, postId } }),
      prisma.post.update({ where: { id: postId }, data: { savesCount: { increment: 1 } } }),
    ]);
    return { saved: true };
  },

  async unsave(userId: string, postId: string) {
    const existing = await prisma.savedPost.findUnique({ where: { userId_postId: { userId, postId } } });
    if (!existing) return { saved: false };
    await prisma.$transaction([
      prisma.savedPost.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: postId }, data: { savesCount: { decrement: 1 } } }),
    ]);
    return { saved: false };
  },

  async addComment(userId: string, postId: string, content: string, parentId?: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new HttpError(404, 'Post not found');
    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: { postId, userId, content, parentId },
        include: { user: true },
      });
      await tx.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });
      return c;
    });
    if (post.userId !== userId) {
      await createNotification({ userId: post.userId, fromUserId: userId, type: 'COMMENT', referenceId: postId });
    }
    return comment;
  },

  async deleteComment(userId: string, commentId: string) {
    const c = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!c) throw new HttpError(404);
    const post = await prisma.post.findUnique({ where: { id: c.postId } });
    if (!post) throw new HttpError(404);
    if (c.userId !== userId && post.userId !== userId) throw new HttpError(403);
    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.post.update({ where: { id: c.postId }, data: { commentsCount: { decrement: 1 } } }),
    ]);
  },

  async feed(userId: string | null, scope: 'for-you' | 'following' | 'explore', cursor?: string, limit = 20) {
    let where: Prisma.PostWhereInput = { isArchived: false, visibility: 'public' };
    if (scope === 'following' && userId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId, status: 'ACCEPTED' },
        select: { followingId: true },
      });
      const ids = follows.map((f) => f.followingId);
      where = { ...where, userId: { in: [...ids, userId] } };
    }
    const posts = await prisma.post.findMany({
      where,
      orderBy: scope === 'explore' ? [{ likesCount: 'desc' }, { createdAt: 'desc' }] : { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: true,
        media: { orderBy: { position: 'asc' } },
      },
    });
    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const last = posts.pop()!;
      nextCursor = last.id;
    }

    if (userId) {
      const ids = posts.map((p) => p.id);
      const [likes, saves] = await Promise.all([
        prisma.like.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } }),
        prisma.savedPost.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } }),
      ]);
      const likedSet = new Set(likes.map((l) => l.postId));
      const savedSet = new Set(saves.map((s) => s.postId));
      return {
        items: posts.map((p) => ({ ...p, liked: likedSet.has(p.id), saved: savedSet.has(p.id) })),
        nextCursor,
      };
    }

    return { items: posts.map((p) => ({ ...p, liked: false, saved: false })), nextCursor };
  },

  async byId(postId: string, viewerId?: string | null) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true, media: { orderBy: { position: 'asc' } } },
    });
    if (!post) throw new HttpError(404, 'Post not found');
    let liked = false;
    let saved = false;
    if (viewerId) {
      const [l, s] = await Promise.all([
        prisma.like.findUnique({ where: { userId_postId: { userId: viewerId, postId } } }),
        prisma.savedPost.findUnique({ where: { userId_postId: { userId: viewerId, postId } } }),
      ]);
      liked = !!l;
      saved = !!s;
    }
    await prisma.post.update({ where: { id: postId }, data: { viewsCount: { increment: 1 } } });
    return { ...post, liked, saved };
  },

  async listComments(postId: string, cursor?: string, limit = 30) {
    const items = await prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: true, replies: { include: { user: true }, take: 3 } },
    });
    let nextCursor: string | null = null;
    if (items.length > limit) {
      const last = items.pop()!;
      nextCursor = last.id;
    }
    return { items, nextCursor };
  },
};
