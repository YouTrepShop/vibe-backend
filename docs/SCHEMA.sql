-- =====================================================
-- Vibe — PostgreSQL schema (reference export of Prisma schema)
-- =====================================================
-- This file is provided for reference only. The source of truth is
-- backend/prisma/schema.prisma — apply migrations with:
--   npm run prisma:migrate           (dev)
--   npx prisma migrate deploy        (prod)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- ENUMS ----------
CREATE TYPE "UserRole"        AS ENUM ('USER','MODERATOR','ADMIN');
CREATE TYPE "AccountStatus"   AS ENUM ('ACTIVE','SUSPENDED','DELETED','PENDING');
CREATE TYPE "PostType"        AS ENUM ('TEXT','IMAGE','VIDEO','CAROUSEL');
CREATE TYPE "MediaType"       AS ENUM ('IMAGE','VIDEO','AUDIO','FILE');
CREATE TYPE "FollowStatus"    AS ENUM ('PENDING','ACCEPTED','BLOCKED');
CREATE TYPE "ChatType"        AS ENUM ('DIRECT','GROUP');
CREATE TYPE "MessageType"     AS ENUM ('TEXT','IMAGE','VIDEO','AUDIO','FILE','STICKER','GIF','CALL','SYSTEM');
CREATE TYPE "CallType"        AS ENUM ('AUDIO','VIDEO','GROUP');
CREATE TYPE "CallStatus"      AS ENUM ('RINGING','ONGOING','ENDED','MISSED','REJECTED');
CREATE TYPE "NotificationType" AS ENUM ('LIKE','COMMENT','FOLLOW','FOLLOW_REQUEST','MENTION','REPOST','MESSAGE','CALL','STORY_VIEW','REEL_LIKE','SYSTEM');
CREATE TYPE "ReportStatus"    AS ENUM ('OPEN','REVIEWED','RESOLVED','REJECTED');
CREATE TYPE "ReportTarget"    AS ENUM ('POST','COMMENT','USER','STORY','REEL','MESSAGE');
CREATE TYPE "ReactionType"    AS ENUM ('LIKE','LOVE','HAHA','WOW','SAD','FIRE');

-- ---------- USER ----------
CREATE TABLE "User" (
  id                   TEXT PRIMARY KEY,
  username             TEXT UNIQUE NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  "emailVerified"      TIMESTAMPTZ,
  "passwordHash"       TEXT,
  "fullName"           TEXT,
  bio                  VARCHAR(280),
  "avatarUrl"          TEXT,
  "coverUrl"           TEXT,
  role                 "UserRole"      NOT NULL DEFAULT 'USER',
  status               "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "isVerified"         BOOLEAN         NOT NULL DEFAULT false,
  "isPrivate"          BOOLEAN         NOT NULL DEFAULT false,
  language             TEXT            NOT NULL DEFAULT 'en',
  theme                TEXT            NOT NULL DEFAULT 'dark',
  "totpSecret"         TEXT,
  "totpEnabled"        BOOLEAN         NOT NULL DEFAULT false,
  "lastSeenAt"         TIMESTAMPTZ,
  "isOnline"           BOOLEAN         NOT NULL DEFAULT false,
  "pushSubscriptionJson" TEXT,
  "followersCount"     INTEGER NOT NULL DEFAULT 0,
  "followingCount"     INTEGER NOT NULL DEFAULT 0,
  "postsCount"         INTEGER NOT NULL DEFAULT 0,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "User_username_idx"  ON "User"(username);
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_status_idx"    ON "User"(status);

-- ---------- AUTH ----------
CREATE TABLE "SocialLink" (
  id        TEXT PRIMARY KEY,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  label     TEXT NOT NULL,
  url       TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX "SocialLink_userId_idx" ON "SocialLink"("userId");

CREATE TABLE "OAuthAccount" (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  email       TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, "providerId")
);
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

CREATE TABLE "AuthSession" (
  id             TEXT PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "refreshToken" TEXT UNIQUE NOT NULL,
  "userAgent"    TEXT,
  ip             TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt"    TIMESTAMPTZ NOT NULL,
  "revokedAt"    TIMESTAMPTZ
);
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

CREATE TABLE "EmailToken" (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "PasswordResetToken" (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Device" (
  id             TEXT PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "pushEndpoint" TEXT UNIQUE,
  p256dh         TEXT,
  "authKey"      TEXT,
  platform       TEXT,
  "lastActiveAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- ---------- SOCIAL GRAPH ----------
CREATE TABLE "Follow" (
  id           TEXT PRIMARY KEY,
  "followerId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "followingId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  status       "FollowStatus" NOT NULL DEFAULT 'ACCEPTED',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("followerId", "followingId")
);
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");
CREATE INDEX "Follow_followerId_idx"  ON "Follow"("followerId");

CREATE TABLE "Block" (
  id          TEXT PRIMARY KEY,
  "blockerId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "blockedId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("blockerId", "blockedId")
);

-- ---------- POSTS ----------
CREATE TABLE "Post" (
  id              TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type            "PostType" NOT NULL DEFAULT 'TEXT',
  content         TEXT,
  hashtags        TEXT[] NOT NULL DEFAULT '{}',
  mentions        TEXT[] NOT NULL DEFAULT '{}',
  visibility      TEXT NOT NULL DEFAULT 'public',
  "isArchived"    BOOLEAN NOT NULL DEFAULT false,
  "isPinned"      BOOLEAN NOT NULL DEFAULT false,
  "likesCount"    INTEGER NOT NULL DEFAULT 0,
  "commentsCount" INTEGER NOT NULL DEFAULT 0,
  "sharesCount"   INTEGER NOT NULL DEFAULT 0,
  "savesCount"    INTEGER NOT NULL DEFAULT 0,
  "viewsCount"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Post_userId_idx"    ON "Post"("userId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_visibility_idx" ON "Post"(visibility);

CREATE TABLE "PostMedia" (
  id        TEXT PRIMARY KEY,
  "postId"  TEXT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  thumbnail TEXT,
  type      "MediaType" NOT NULL,
  width     INTEGER,
  height    INTEGER,
  duration  INTEGER,
  position  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX "PostMedia_postId_idx" ON "PostMedia"("postId");

CREATE TABLE "Comment" (
  id          TEXT PRIMARY KEY,
  "postId"    TEXT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "parentId"  TEXT REFERENCES "Comment"(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  "likesCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Comment_postId_idx"   ON "Comment"("postId");
CREATE INDEX "Comment_userId_idx"   ON "Comment"("userId");
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

CREATE TABLE "Like" (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "postId"    TEXT REFERENCES "Post"(id) ON DELETE CASCADE,
  "commentId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "postId")
);
CREATE INDEX "Like_postId_idx" ON "Like"("postId");
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

CREATE TABLE "SavedPost" (
  id        TEXT PRIMARY KEY,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "postId"  TEXT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "postId")
);

CREATE TABLE "Reaction" (
  id        TEXT PRIMARY KEY,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "postId"  TEXT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  type      "ReactionType" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "postId")
);

CREATE TABLE "Repost" (
  id        TEXT PRIMARY KEY,
  "postId"  TEXT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  "userId"  TEXT NOT NULL,
  comment   VARCHAR(280),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Repost_postId_idx" ON "Repost"("postId");
CREATE INDEX "Repost_userId_idx" ON "Repost"("userId");

-- ---------- STORIES / REELS ----------
CREATE TABLE "Story" (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "mediaUrl"  TEXT NOT NULL,
  "mediaType" "MediaType" NOT NULL,
  thumbnail   TEXT,
  caption     TEXT,
  music       TEXT,
  stickers    JSONB,
  "viewsCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Story_userId_idx"    ON "Story"("userId");
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");

CREATE TABLE "StoryView" (
  id        TEXT PRIMARY KEY,
  "storyId" TEXT NOT NULL REFERENCES "Story"(id) ON DELETE CASCADE,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  reaction  TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("storyId", "userId")
);
CREATE INDEX "StoryView_storyId_idx" ON "StoryView"("storyId");

CREATE TABLE "Reel" (
  id              TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "videoUrl"      TEXT NOT NULL,
  thumbnail       TEXT,
  caption         TEXT,
  music           TEXT,
  hashtags        TEXT[] NOT NULL DEFAULT '{}',
  duration        INTEGER,
  "viewsCount"    INTEGER NOT NULL DEFAULT 0,
  "likesCount"    INTEGER NOT NULL DEFAULT 0,
  "commentsCount" INTEGER NOT NULL DEFAULT 0,
  "sharesCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Reel_userId_idx"    ON "Reel"("userId");
CREATE INDEX "Reel_createdAt_idx" ON "Reel"("createdAt");

CREATE TABLE "ReelView" (
  id        TEXT PRIMARY KEY,
  "reelId"  TEXT NOT NULL REFERENCES "Reel"(id) ON DELETE CASCADE,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  watched   INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("reelId", "userId")
);

-- ---------- HASHTAGS ----------
CREATE TABLE "Hashtag" (
  id          TEXT PRIMARY KEY,
  tag         TEXT UNIQUE NOT NULL,
  "postsCount" INTEGER NOT NULL DEFAULT 0,
  "reelsCount" INTEGER NOT NULL DEFAULT 0,
  "trendScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "HashtagFollow" (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "hashtagId" TEXT NOT NULL REFERENCES "Hashtag"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "hashtagId")
);

-- ---------- CHAT ----------
CREATE TABLE "Chat" (
  id              TEXT PRIMARY KEY,
  type            "ChatType" NOT NULL DEFAULT 'DIRECT',
  title           TEXT,
  "avatarUrl"     TEXT,
  "lastMessageAt" TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Chat_lastMessageAt_idx" ON "Chat"("lastMessageAt");

CREATE TABLE "ChatMember" (
  id          TEXT PRIMARY KEY,
  "chatId"    TEXT NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',
  "joinedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastReadAt" TIMESTAMPTZ,
  "isMuted"   BOOLEAN NOT NULL DEFAULT false,
  UNIQUE ("chatId", "userId")
);
CREATE INDEX "ChatMember_userId_idx" ON "ChatMember"("userId");
CREATE INDEX "ChatMember_chatId_idx" ON "ChatMember"("chatId");

CREATE TABLE "PinnedChat" (
  id        TEXT PRIMARY KEY,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "chatId"  TEXT NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "chatId")
);

CREATE TABLE "Message" (
  id          TEXT PRIMARY KEY,
  "chatId"    TEXT NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  "senderId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type        "MessageType" NOT NULL DEFAULT 'TEXT',
  content     TEXT,
  "mediaUrl"  TEXT,
  "mediaType" "MediaType",
  "durationMs" INTEGER,
  "replyToId" TEXT REFERENCES "Message"(id) ON DELETE SET NULL,
  "isEdited"  BOOLEAN NOT NULL DEFAULT false,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Message_chatId_idx"    ON "Message"("chatId");
CREATE INDEX "Message_senderId_idx"  ON "Message"("senderId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

CREATE TABLE "MessageRead" (
  id          TEXT PRIMARY KEY,
  "messageId" TEXT NOT NULL REFERENCES "Message"(id) ON DELETE CASCADE,
  "userId"    TEXT NOT NULL,
  "readAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("messageId", "userId")
);

-- ---------- CALLS ----------
CREATE TABLE "Call" (
  id            TEXT PRIMARY KEY,
  "chatId"      TEXT REFERENCES "Chat"(id) ON DELETE SET NULL,
  "initiatorId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type          "CallType" NOT NULL DEFAULT 'AUDIO',
  status        "CallStatus" NOT NULL DEFAULT 'RINGING',
  "startedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "endedAt"     TIMESTAMPTZ,
  "durationSec" INTEGER,
  "recordingUrl" TEXT
);
CREATE INDEX "Call_initiatorId_idx" ON "Call"("initiatorId");
CREATE INDEX "Call_chatId_idx"      ON "Call"("chatId");

CREATE TABLE "CallParticipant" (
  id        TEXT PRIMARY KEY,
  "callId"  TEXT NOT NULL REFERENCES "Call"(id) ON DELETE CASCADE,
  "userId"  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "leftAt"  TIMESTAMPTZ,
  UNIQUE ("callId", "userId")
);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE "Notification" (
  id           TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "fromUserId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  type         "NotificationType" NOT NULL,
  "referenceId" TEXT,
  data         JSONB,
  "isRead"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId","isRead");
CREATE INDEX "Notification_createdAt_idx"     ON "Notification"("createdAt");

-- ---------- MODERATION ----------
CREATE TABLE "Report" (
  id          TEXT PRIMARY KEY,
  "reporterId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "subjectId"  TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  target      "ReportTarget" NOT NULL,
  "targetId"  TEXT NOT NULL,
  reason      TEXT NOT NULL,
  details     TEXT,
  status      "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolvedAt" TIMESTAMPTZ,
  "resolverId" TEXT
);
CREATE INDEX "Report_target_targetId_idx" ON "Report"(target,"targetId");
CREATE INDEX "Report_status_idx"          ON "Report"(status);

CREATE TABLE "AuditLog" (
  id        TEXT PRIMARY KEY,
  "actorId" TEXT,
  action    TEXT NOT NULL,
  target    TEXT,
  meta      JSONB,
  ip        TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "AuditLog_actorId_idx"   ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx"    ON "AuditLog"(action);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ---------- SYSTEM ----------
CREATE TABLE "AppSetting" (
  key       TEXT PRIMARY KEY,
  value     JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
