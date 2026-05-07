# Vibe — REST API & Socket.io reference

Base URL: `http://localhost:4000/api` (dev) · `https://your-domain/api` (prod).

All responses follow the envelope:
```json
{ "ok": true,  "data": {...} }
{ "ok": false, "error": "Message", "code": 400 }
```

Auth: `Authorization: Bearer <accessToken>` **or** `vibe_access` HttpOnly cookie. Refresh token is stored in the HttpOnly `vibe_refresh` cookie and rotated on every `POST /auth/refresh`.

---

## Auth — `/auth`

| Method | Path | Auth | Body | Description |
| ------ | ---- | ---- | ---- | ----------- |
| POST | `/auth/register` | – | `{ email, username, password, fullName? }` | Create account, send verification email |
| POST | `/auth/login` | – | `{ email, password, totp? }` | Returns `{ user, accessToken }`, sets refresh cookie |
| POST | `/auth/logout` | bearer | – | Revoke refresh session |
| POST | `/auth/refresh` | refresh cookie | – | Rotate tokens |
| POST | `/auth/verify-email` | – | `{ token }` | Mark email verified |
| POST | `/auth/forgot-password` | – | `{ email }` | Send reset email |
| POST | `/auth/reset-password` | – | `{ token, password }` | Set new password |
| GET  | `/auth/me` | bearer | – | Current user |
| POST | `/auth/2fa/enroll` | bearer | – | Returns `{ secret, otpauth, qr }` |
| POST | `/auth/2fa/enable` | bearer | `{ token }` | Verify TOTP, enable 2FA |
| POST | `/auth/2fa/disable` | bearer | `{ token }` | Disable 2FA |
| GET  | `/auth/oauth/:provider` | – | – | OAuth start (google/apple) |
| GET  | `/auth/oauth/:provider/callback` | – | – | OAuth callback |

Rate limited: 20 requests / 15 min per IP.

---

## Users — `/users`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/users/me` | bearer | Current user (full) |
| PATCH | `/users/me` | bearer | Update `fullName`, `bio`, `isPrivate`, `language`, `theme` |
| POST | `/users/me/avatar` | bearer · multipart | Upload avatar |
| POST | `/users/me/cover` | bearer · multipart | Upload cover |
| POST | `/users/me/social-links` | bearer | Replace social links |
| GET | `/users/:username` | optional | Public profile |
| GET | `/users/:username/posts` | optional | Posts of user |
| GET | `/users/:username/reels` | optional | Reels of user |
| GET | `/users/:username/followers` | bearer | Followers list |
| GET | `/users/:username/following` | bearer | Following list |

---

## Follows — `/follows`

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/follows/:userId` | Follow user (or request if private) |
| DELETE | `/follows/:userId` | Unfollow |
| POST | `/follows/requests/:id/accept` | Accept follow request |
| POST | `/follows/requests/:id/reject` | Reject follow request |
| GET | `/follows/requests` | Pending follow requests |

---

## Posts — `/posts`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/posts/feed?scope=for-you\|following\|explore&cursor=&limit=` | Feed (cursor-paginated) |
| GET | `/posts/:id` | Single post |
| POST | `/posts` (multipart `media[]`) | Create post — fields: `content`, `type`, `hashtags`, `visibility` |
| DELETE | `/posts/:id` | Delete own post |
| POST | `/posts/:id/like` | Like |
| DELETE | `/posts/:id/like` | Unlike |
| POST | `/posts/:id/save` | Save |
| DELETE | `/posts/:id/save` | Unsave |
| POST | `/posts/:id/repost` | Repost |
| POST | `/posts/:id/comments` | `{ content, parentId? }` |
| GET | `/posts/:id/comments?cursor=` | List comments |
| DELETE | `/comments/:id` | Delete own comment |
| POST | `/comments/:id/like` | Like comment |

---

## Stories — `/stories`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/stories` | Stories grouped by user (followed users + me) |
| POST | `/stories` (multipart `file`) | Create story (24h TTL) |
| POST | `/stories/:id/view` | Mark viewed (with optional `reaction`) |
| GET | `/stories/:id/viewers` | Viewers (owner only) |
| DELETE | `/stories/:id` | Delete |

---

## Reels — `/reels`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/reels/feed?cursor=` | Vertical feed |
| POST | `/reels` (multipart `file`) | Upload reel |
| POST | `/reels/:id/like` | Like / unlike |
| POST | `/reels/:id/view` | Increment views |
| DELETE | `/reels/:id` | Delete |

---

## Chats & Messages — `/chats`, `/messages`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/chats` | List chats with last message + peer |
| POST | `/chats/direct` | `{ userId }` — open or create direct chat |
| POST | `/chats/group` | `{ title, memberIds[] }` — create group |
| POST | `/chats/:id/members` | Add members (group) |
| DELETE | `/chats/:id/members/:userId` | Remove member |
| POST | `/chats/:id/pin` | Pin chat |
| POST | `/chats/:id/mute` | Mute chat |
| GET | `/messages/:chatId?cursor=` | Messages history |
| POST | `/messages/:chatId` | `{ content, replyToId? }` |
| POST | `/messages/:chatId/upload` (multipart `file`) | Send media |
| DELETE | `/messages/:id` | Delete own message |
| POST | `/messages/:id/read` | Mark message read |

---

## Calls — `/calls`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/calls/ice` | Returns ICE servers `{ iceServers: [...] }` |
| GET | `/calls/history` | Last 50 calls |
| POST | `/calls` | `{ chatId?, type, participantIds[] }` — create call |
| POST | `/calls/:id/end` | End call (records duration) |

WebRTC negotiation happens via Socket.io events (`call:invite`, `call:accept`, `call:decline`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice`, `call:hangup`).

---

## Notifications — `/notifications`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/notifications?cursor=` | Notifications |
| POST | `/notifications/read-all` | Mark all read |
| POST | `/notifications/:id/read` | Mark one read |
| POST | `/notifications/push/subscribe` | Save Web Push subscription |

---

## Search — `/search`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/search?q=&type=all\|users\|posts\|hashtags` | Search |
| GET | `/search/trending` | Trending hashtags + suggested users + popular posts |

---

## Admin — `/admin` (role: ADMIN/MODERATOR)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/admin/dashboard` | Counters (users, posts, chats, calls, reports, online) |
| GET | `/admin/users?cursor=&q=` | List users |
| POST | `/admin/users/:id/suspend` | Suspend user |
| POST | `/admin/users/:id/restore` | Restore user |
| GET | `/admin/reports?status=` | Reports queue |
| POST | `/admin/reports/:id/resolve` | Resolve report |
| GET | `/admin/audit` | Audit log |

---

## Socket.io

Connect to `/` with `auth: { token: '<accessToken>' }`. Each user joins a personal room `user:<id>`.

### Server emits → client listens
| Event | Payload |
| ----- | ------- |
| `notification:new` | `Notification` |
| `presence:update` | `{ userId, isOnline, lastSeenAt }` |
| `chat:message` | `Message` |
| `chat:typing` | `{ chatId, userId, isTyping }` |
| `chat:read` | `{ chatId, userId, lastReadAt }` |
| `call:invite` | `{ from: User, call: { id, type } }` |
| `call:accept` | `{ from: User, call }` |
| `call:decline` | `{ from: User, call }` |
| `call:hangup` | `{ from: User, call }` |
| `webrtc:offer` | `{ from: User, sdp }` |
| `webrtc:answer` | `{ from: User, sdp }` |
| `webrtc:ice` | `{ from: User, candidate }` |

### Client emits → server listens
| Event | Payload |
| ----- | ------- |
| `chat:join` | `chatId` or `{ chatId }` |
| `chat:leave` | `chatId` |
| `chat:typing` | `{ chatId, isTyping }` |
| `call:invite` | `{ toUserId, type }` |
| `call:accept` / `call:decline` / `call:hangup` | `{ toUserId }` |
| `webrtc:offer` | `{ toUserId, sdp }` |
| `webrtc:answer` | `{ toUserId, sdp }` |
| `webrtc:ice` | `{ toUserId, candidate }` |
