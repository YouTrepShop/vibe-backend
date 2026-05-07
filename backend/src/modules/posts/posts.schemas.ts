import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().max(2200).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL']).default('TEXT'),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  hashtags: z.array(z.string().max(64)).max(30).optional(),
  mentions: z.array(z.string().max(24)).max(30).optional(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        thumbnail: z.string().url().optional(),
        type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE']),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
        duration: z.number().int().optional(),
      }),
    )
    .max(10)
    .optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().optional(),
});

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  scope: z.enum(['for-you', 'following', 'explore']).default('for-you'),
});
