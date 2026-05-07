import type { User } from '@prisma/client';

export type PublicUser = {
  id: string;
  username: string;
  email?: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isOnline: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
};

export function sanitizeUser(u: User): PublicUser & { email: string } {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    coverUrl: u.coverUrl,
    isVerified: u.isVerified,
    isPrivate: u.isPrivate,
    followersCount: u.followersCount,
    followingCount: u.followingCount,
    postsCount: u.postsCount,
    isOnline: u.isOnline,
    lastSeenAt: u.lastSeenAt,
    createdAt: u.createdAt,
  };
}

export function publicUser(u: User): PublicUser {
  const s = sanitizeUser(u);
  // hide email for non-self
  const { email: _email, ...rest } = s;
  return rest;
}
