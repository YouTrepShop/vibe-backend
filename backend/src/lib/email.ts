import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter: Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!transporter) {
    logger.warn({ to: opts.to, subject: opts.subject }, '[email] SMTP not configured — skipping send');
    return;
  }
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

export const Emails = {
  verify(link: string) {
    return {
      subject: 'Подтвердите ваш Vibe-аккаунт',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#0c0a14;padding:32px;color:#e8e6f1">
          <h2 style="color:#a78bfa">Добро пожаловать в Vibe!</h2>
          <p>Подтвердите ваш email, чтобы начать.</p>
          <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#7c65d1,#a78bfa);color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none">Подтвердить email</a>
        </div>
      `,
    };
  },
  reset(link: string) {
    return {
      subject: 'Сброс пароля Vibe',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#0c0a14;padding:32px;color:#e8e6f1">
          <h2 style="color:#a78bfa">Сброс пароля</h2>
          <p>Перейдите по ссылке, чтобы задать новый пароль (действительна 1 час):</p>
          <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#7c65d1,#a78bfa);color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none">Сбросить пароль</a>
        </div>
      `,
    };
  },
};
