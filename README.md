# Vibe — modern social network

> A production-grade monorepo for **Vibe** — a next-generation social network combining the best of Instagram, VK, Twitter (X), Telegram and TikTok.

Dark/purple UI · glassmorphism · smooth animations · mobile-first · PWA installable.

```
React 18 · TypeScript · Vite · TailwindCSS · Framer Motion · Zustand · React Router · Socket.io
Node.js · Express · TypeScript · Prisma · PostgreSQL · Socket.io · JWT · WebRTC signaling · Argon2/Bcrypt
```

---

## Monorepo layout

```
vibe/
├─ backend/                 # Node + Express + Prisma + Socket.io + WebRTC signaling
│  ├─ src/
│  │  ├─ config/           # env, prisma, logger
│  │  ├─ lib/              # http, validate, jwt, mailer, storage, socket auth
│  │  ├─ middleware/       # auth, rateLimit, error, upload (multer)
│  │  ├─ modules/          # feature modules (auth, users, posts, ...)
│  │  ├─ routes/           # API router
│  │  ├─ sockets/          # Socket.io server (chat, presence, calls)
│  │  ├─ server.ts         # express factory
│  │  └─ index.ts          # http + socket bootstrap
│  ├─ prisma/              # schema.prisma + seed.ts
│  └─ Dockerfile
├─ frontend/                # React + Vite + Tailwind + Framer Motion + Zustand
│  ├─ src/
│  │  ├─ app/              # App.tsx
│  │  ├─ routes/           # AppRoutes.tsx (lazy)
│  │  ├─ pages/            # auth, feed, profile, chat, reels, ...
│  │  ├─ components/       # ui primitives, post, story, calls, layout
│  │  ├─ stores/           # zustand stores (auth, ui, chat, calls)
│  │  ├─ services/         # axios + socket
│  │  ├─ hooks/            # custom hooks
│  │  └─ styles/           # globals.css (Tailwind)
│  ├─ public/              # PWA icons, manifest
│  └─ Dockerfile
├─ nginx/                   # reverse proxy config (api + ws + static)
├─ docs/                    # API.md, SCHEMA.sql, DEPLOYMENT.md
├─ docker-compose.yml
├─ .env.example
└─ package.json             # npm workspaces (backend + frontend)
```

---

## Features

### Auth
- Register / login with email + password (Argon2id; bcrypt fallback)
- Email verification, password reset
- JWT access (15m) + refresh (30d) with rotation, secure HttpOnly cookies
- 2FA TOTP (speakeasy) with QR enrolment
- OAuth Google / Apple stubs
- Brute-force protection (rate limit on `/auth/*`)

### Profiles
- Username, full name, bio, avatar, cover, social links
- Verified badge, private accounts, follower / following counters
- Edit profile, theme, language, privacy

### Posts
- Text / image / video / carousel posts
- Hashtags, mentions, likes, comments, reposts, saves, views
- Algorithmic feeds: `for-you` · `following` · `explore`
- Infinite scroll, optimistic UI

### Stories
- Image / video stories with 24h expiry
- Viewer list, reactions, music, stickers, caption
- Story creator + viewer with autoplay & taps

### Reels
- Vertical short videos with snap-scroll & autoplay (IntersectionObserver)
- Trending feed, like / share / save

### Messenger
- Direct & group chats
- Text, media, voice, GIF, sticker, file messages
- Reply, delete, pin, mute, read receipts, typing indicator
- Realtime via Socket.io with presence (`isOnline`, `lastSeenAt`)

### Audio / Video calls
- WebRTC peer connection negotiated over Socket.io (offer/answer/ICE)
- Audio, video, group calls, screen sharing
- ICE/STUN/TURN configurable via env (`/api/calls/ice`)
- Call history (`durationSec`, status)

### Notifications
- Realtime via Socket.io
- Types: LIKE, COMMENT, FOLLOW, FOLLOW_REQUEST, MENTION, REPOST, MESSAGE, CALL, STORY_VIEW, REEL_LIKE, SYSTEM
- Web Push (VAPID) ready

### Search
- Users, posts, hashtags
- Trending tags, suggested friends

### Admin
- Dashboard (users, posts, chats, calls, reports, online)
- User suspend / restore
- Content moderation (reports queue, resolve)
- Audit log

### Security
- Helmet, CORS, compression
- Rate limiting (global + per-route)
- Zod validation on every body / query
- Argon2id password hashing
- HttpOnly secure cookies for refresh tokens
- CSRF-safe (token in body for sensitive actions)

---

## Quick start (local dev)

### 1. Prerequisites
- Node.js ≥ 20, npm ≥ 10
- PostgreSQL ≥ 14 (or use docker-compose)

### 2. Install
```bash
git clone https://github.com/YouTrepShop/vibe-backend.git vibe
cd vibe
cp .env.example .env
npm install
```

### 3. Database
```bash
# spin up postgres only via docker
docker compose up -d postgres

# generate prisma client + run migrations
npm run prisma:generate
npm run prisma:migrate

# seed demo data (optional)
npm run db:seed
```

### 4. Run
```bash
# both backend and frontend in parallel
npm run dev

# or separately
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173
```

Open the frontend at <http://localhost:5173>. The backend listens on `http://localhost:4000` and exposes `/api/*` and `/socket.io/*`.

---

## Production (docker-compose)

```bash
cp .env.example .env
# edit .env — set strong JWT secrets, storage driver, TURN credentials, etc.

docker compose up -d --build
```

The stack runs:
- `postgres` — PostgreSQL 16
- `backend` — Node API + Socket.io on port 4000
- `frontend` — static SPA built and served by Nginx
- `nginx` — reverse proxy on port 80 (`/`, `/api`, `/socket.io/`, `/uploads`)

Open <http://localhost>.

---

## Scripts

Run at the **monorepo root**:

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start backend (4000) + frontend (5173) in parallel |
| `npm run build` | Build backend (`tsc`) + frontend (`vite build`) |
| `npm run typecheck` | TS typecheck both packages |
| `npm run lint` | ESLint both packages |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run prisma migrate dev |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed demo data |

---

## Environment variables

See [`.env.example`](./.env.example) for the full list. Key ones:

```bash
# backend
DATABASE_URL=postgresql://vibe:vibe@localhost:5432/vibe?schema=public
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
APP_URL=http://localhost:5173
API_URL=http://localhost:4000
STORAGE_DRIVER=local|cloudinary|s3
STUN_URLS=stun:stun.l.google.com:19302
TURN_URLS=turn:turn.example.com:3478
TURN_USERNAME=...
TURN_CREDENTIAL=...

# frontend
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_APP_NAME=Vibe
```

---

## API & schema

- API reference: [`docs/API.md`](./docs/API.md)
- Database schema (Prisma): [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma)
- Plain SQL schema export: [`docs/SCHEMA.sql`](./docs/SCHEMA.sql)
- Deployment guide: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

---

## License

MIT — see project owner.
