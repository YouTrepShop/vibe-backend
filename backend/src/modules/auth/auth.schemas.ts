import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscore'),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(3), // email or username
  password: z.string().min(1),
  totp: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotSchema = z.object({
  email: z.string().email(),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export const enable2faSchema = z.object({
  token: z.string().min(6).max(8),
});
