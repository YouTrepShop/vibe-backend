export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  createdAt: string;
  socialLinks?: SocialLink[];
  isFollowing?: boolean;
  isRequested?: boolean;
  isSelf?: boolean;
  totpEnabled?: boolean;
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING';
  language?: string;
  theme?: string;
}

export interface SocialLink {
  id?: string;
  label: string;
  url: string;
  position: number;
}

export interface PostMedia {
  id: string;
  url: string;
  thumbnail?: string | null;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  width?: number;
  height?: number;
  duration?: number;
  position: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  hashtags: string[];
  mentions: string[];
  visibility: 'public' | 'followers' | 'private';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  viewsCount: number;
  createdAt: string;
  media: PostMedia[];
  liked?: boolean;
  saved?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likesCount: number;
  createdAt: string;
  user: User;
  replies?: Comment[];
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  thumbnail?: string | null;
  mediaType: 'IMAGE' | 'VIDEO';
  caption?: string | null;
  music?: string | null;
  expiresAt: string;
  createdAt: string;
  viewsCount: number;
  user?: User;
}

export interface StoryGroup {
  user: User;
  items: Story[];
}

export interface Reel {
  id: string;
  userId: string;
  videoUrl: string;
  thumbnail?: string | null;
  caption?: string | null;
  music?: string | null;
  hashtags: string[];
  duration: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: User;
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title?: string;
  avatarUrl?: string;
  members: { userId: string; role: string; user: User }[];
  lastMessage?: Message | null;
  lastMessageAt?: string | null;
  lastReadAt?: string | null;
  isMuted?: boolean;
  unreadCount?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'STICKER' | 'GIF' | 'CALL' | 'SYSTEM';
  content: string | null;
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | null;
  durationMs?: number | null;
  replyToId?: string | null;
  replyTo?: Message | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: User;
}

export interface Notification {
  id: string;
  userId: string;
  fromUserId?: string;
  type:
    | 'LIKE'
    | 'COMMENT'
    | 'FOLLOW'
    | 'FOLLOW_REQUEST'
    | 'MENTION'
    | 'REPOST'
    | 'MESSAGE'
    | 'CALL'
    | 'STORY_VIEW'
    | 'REEL_LIKE'
    | 'SYSTEM';
  referenceId?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  fromUser?: User | null;
}

export interface Hashtag {
  id: string;
  tag: string;
  postsCount: number;
  trendScore: number;
}

export interface Envelope<T> {
  ok: true;
  data: T;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}
