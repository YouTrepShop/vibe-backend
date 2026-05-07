# Vibe — deployment guide

This document describes how to deploy Vibe on a production VPS using Docker, Nginx and PostgreSQL.

## 1. Prerequisites

- Linux VPS (Ubuntu 22.04+ recommended), 2 vCPU / 4 GB RAM minimum
- Domain pointing to the VPS
- Docker + docker-compose-plugin
- Optional: Cloudinary or AWS S3 account (production media storage)
- Optional: TURN server (coturn) for WebRTC across NAT

## 2. Clone and configure

```bash
git clone https://github.com/YouTrepShop/vibe-backend.git vibe
cd vibe
cp .env.example .env
```

Edit `.env`. Required for production:

```env
NODE_ENV=production
APP_URL=https://your-domain.com
API_URL=https://your-domain.com/api
DATABASE_URL=postgresql://vibe:CHANGE_ME@postgres:5432/vibe?schema=public

JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

STUN_URLS=stun:stun.l.google.com:19302
TURN_URLS=turn:turn.your-domain.com:3478
TURN_USERNAME=...
TURN_CREDENTIAL=...

VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

VITE_API_URL=/api
VITE_SOCKET_URL=/
```

## 3. Build & run

```bash
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run db:seed   # optional
```

The stack runs:

| Service | Port | Notes |
| ------- | ---- | ----- |
| nginx | 80 | reverse proxy `/`, `/api`, `/socket.io`, `/uploads` |
| frontend | (internal) | Nginx serving the Vite build |
| backend | (internal 4000) | Express + Socket.io |
| postgres | 5432 | data volume `postgres_data` |

## 4. HTTPS (Let's Encrypt)

Run a one-shot certbot container, then mount certs into Nginx:

```bash
docker run -it --rm --name certbot \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  -p 80:80 -p 443:443 \
  certbot/certbot certonly --standalone -d your-domain.com
```

Then update `nginx/default.conf` to add:

```nginx
server {
  listen 443 ssl http2;
  server_name your-domain.com;
  ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
  # ... include the same locations as the :80 block
}
server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$host$request_uri;
}
```

And mount the certs in `docker-compose.yml`:

```yaml
nginx:
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
  ports:
    - "80:80"
    - "443:443"
```

Reload: `docker compose restart nginx`.

## 5. TURN server (optional but recommended for calls)

For reliable audio/video across NAT, run [coturn](https://github.com/coturn/coturn) on a separate host or as a sidecar:

```bash
docker run -d --restart unless-stopped --name coturn \
  -p 3478:3478 -p 3478:3478/udp \
  -p 49152-65535:49152-65535/udp \
  coturn/coturn -n --log-file=stdout \
    --realm=your-domain.com \
    --user=vibe:CHANGE_ME \
    --no-tls --no-dtls --fingerprint
```

Set `TURN_URLS=turn:turn.your-domain.com:3478`, `TURN_USERNAME=vibe`, `TURN_CREDENTIAL=CHANGE_ME`.

## 6. Backups

```bash
# daily postgres dump
docker compose exec -T postgres pg_dump -U vibe vibe | gzip > vibe-$(date +%F).sql.gz
```

## 7. Updates

```bash
git pull
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

## 8. CI/CD

A typical GitHub Actions workflow:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. SSH to VPS, `git pull`, `docker compose up -d --build`

## 9. Observability

- Logs: `docker compose logs -f backend`
- Health: `GET /api/health`
- Prisma Studio: `npm run prisma:studio` (dev only)

## 10. Hardening checklist

- [ ] Strong `JWT_*_SECRET`, rotate periodically
- [ ] DB password is not the default
- [ ] HTTPS only (HSTS via Nginx)
- [ ] `STORAGE_DRIVER=cloudinary` or `s3` (not `local`) in production
- [ ] Web push VAPID keys configured
- [ ] Rate limit env vars tuned for traffic
- [ ] Backups scheduled
- [ ] TURN server reachable from clients
