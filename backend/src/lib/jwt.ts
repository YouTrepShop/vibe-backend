import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type JwtPayload = {
  sub: string;
  username: string;
  role: string;
  type: 'access' | 'refresh';
};

export function signAccessToken(payload: Omit<JwtPayload, 'type'>) {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, opts);
}

export function signRefreshToken(payload: Omit<JwtPayload, 'type'>) {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
