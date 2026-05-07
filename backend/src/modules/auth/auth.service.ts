import { prisma } from '../../config/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefresh } from '../../lib/jwt.js';
import { HttpError } from '../../lib/http.js';
import { Emails, sendEmail } from '../../lib/email.js';
import { env } from '../../config/env.js';
import { nanoid } from 'nanoid';
import { generateTotpSecret, verifyTotp } from '../../lib/totp.js';

export type AuthTokens = { accessToken: string; refreshToken: string };

function tokens(userId: string, username: string, role: string): AuthTokens {
  return {
    accessToken: signAccessToken({ sub: userId, username, role }),
    refreshToken: signRefreshToken({ sub: userId, username, role }),
  };
}

export const AuthService = {
  async register(input: { email: string; username: string; password: string; fullName?: string }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
    });
    if (existing) {
      if (existing.email === input.email) throw new HttpError(409, 'Email already in use', 'EMAIL_TAKEN');
      throw new HttpError(409, 'Username already taken', 'USERNAME_TAKEN');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        fullName: input.fullName,
      },
    });

    const verifyToken = nanoid(40);
    await prisma.emailToken.create({
      data: {
        userId: user.id,
        token: verifyToken,
        type: 'verify',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const link = `${env.APP_URL}/auth/verify?token=${verifyToken}`;
    const tpl = Emails.verify(link);
    await sendEmail({ to: user.email, ...tpl }).catch(() => {});

    const t = tokens(user.id, user.username, user.role);
    await prisma.authSession.create({
      data: {
        userId: user.id,
        refreshToken: t.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { user, ...t };
  },

  async login(input: { identifier: string; password: string; totp?: string }, meta: { ua?: string; ip?: string }) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: input.identifier }, { username: input.identifier }] },
    });
    if (!user || !user.passwordHash) throw new HttpError(401, 'Invalid credentials', 'BAD_CREDS');

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Invalid credentials', 'BAD_CREDS');

    if (user.status === 'SUSPENDED') throw new HttpError(403, 'Account suspended', 'ACCOUNT_SUSPENDED');
    if (user.status === 'DELETED') throw new HttpError(410, 'Account deleted', 'ACCOUNT_DELETED');

    if (user.totpEnabled && user.totpSecret) {
      if (!input.totp) throw new HttpError(401, '2FA token required', 'TOTP_REQUIRED');
      const valid = verifyTotp(user.totpSecret, input.totp);
      if (!valid) throw new HttpError(401, 'Invalid 2FA token', 'TOTP_INVALID');
    }

    const t = tokens(user.id, user.username, user.role);
    await prisma.authSession.create({
      data: {
        userId: user.id,
        refreshToken: t.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userAgent: meta.ua,
        ip: meta.ip,
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });

    return { user, ...t };
  },

  async refresh(refreshToken?: string) {
    if (!refreshToken) throw new HttpError(401, 'Missing refresh token');
    let payload;
    try {
      payload = verifyRefresh(refreshToken);
    } catch {
      throw new HttpError(401, 'Invalid refresh token');
    }
    const session = await prisma.authSession.findUnique({ where: { refreshToken } });
    if (!session || session.revokedAt) throw new HttpError(401, 'Session not found or revoked');
    if (session.expiresAt < new Date()) throw new HttpError(401, 'Session expired');

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new HttpError(401, 'User not found');

    const t = tokens(user.id, user.username, user.role);
    // rotate
    await prisma.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    await prisma.authSession.create({
      data: {
        userId: user.id,
        refreshToken: t.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return { user, ...t };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    await prisma.authSession.updateMany({ where: { refreshToken }, data: { revokedAt: new Date() } }).catch(() => {});
  },

  async verifyEmail(token: string) {
    const t = await prisma.emailToken.findUnique({ where: { token } });
    if (!t || t.type !== 'verify') throw new HttpError(400, 'Invalid token');
    if (t.expiresAt < new Date()) throw new HttpError(400, 'Token expired');
    await prisma.user.update({ where: { id: t.userId }, data: { emailVerified: new Date() } });
    await prisma.emailToken.delete({ where: { id: t.id } });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // do not reveal
    const token = nanoid(48);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${env.APP_URL}/auth/reset?token=${token}`;
    const tpl = Emails.reset(link);
    await sendEmail({ to: user.email, ...tpl }).catch(() => {});
  },

  async resetPassword(token: string, password: string) {
    const t = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!t || t.usedAt) throw new HttpError(400, 'Invalid or used token');
    if (t.expiresAt < new Date()) throw new HttpError(400, 'Token expired');
    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: t.userId }, data: { passwordHash } });
    await prisma.passwordResetToken.update({ where: { id: t.id }, data: { usedAt: new Date() } });
    await prisma.authSession.updateMany({ where: { userId: t.userId }, data: { revokedAt: new Date() } });
  },

  async start2fa(userId: string, label: string) {
    const secret = generateTotpSecret(label);
    await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret.base32 } });
    return { secret: secret.base32, otpauthUrl: secret.otpauth_url };
  },

  async enable2fa(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) throw new HttpError(400, '2FA not initialized');
    if (!verifyTotp(user.totpSecret, token)) throw new HttpError(400, 'Invalid token');
    await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
  },

  async disable2fa(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });
  },
};
