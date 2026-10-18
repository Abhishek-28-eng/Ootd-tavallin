import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

function createTransport() {
  if (!env.SMTP_HOST) {
    // No SMTP configured — log emails in dev
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

const transport = createTransport();

function getAppUrl(): string {
  return env.API_BASE_URL.replace('/api', '');
}

export const emailService = {
  async sendVerificationEmail(
    to: string,
    displayName: string,
    token: string,
  ): Promise<void> {
    const url = `${getAppUrl()}/verify-email?token=${token}`;
    try {
      const info = await transport.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject: 'Verify your Tavallin account',
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 520px; margin: 0 auto; color: #1A1A1A;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Welcome to Tavallin, ${displayName} ✨</h1>
            <p style="color: #555; line-height: 1.6;">Please verify your email address to complete your registration.</p>
            <a href="${url}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #1A1A1A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Verify Email
            </a>
            <p style="color: #888; font-size: 13px;">This link expires in ${env.EMAIL_VERIFY_TOKEN_EXPIRES_HOURS} hours. If you didn't create an account, you can ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">© ${new Date().getFullYear()} Tavallin · Wear Your Story</p>
          </div>
        `,
        text: `Welcome to Tavallin, ${displayName}!\n\nVerify your email: ${url}\n\nLink expires in ${env.EMAIL_VERIFY_TOKEN_EXPIRES_HOURS} hours.`,
      });

      if (!env.SMTP_HOST) {
        logger.debug({ preview: JSON.stringify(info) }, 'Email (dev mode, not actually sent)');
      }
    } catch (err) {
      logger.error({ err, to }, 'Failed to send verification email');
    }
  },

  async sendPasswordResetEmail(
    to: string,
    displayName: string,
    token: string,
  ): Promise<void> {
    const url = `${getAppUrl()}/reset-password?token=${token}`;
    try {
      const info = await transport.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject: 'Reset your Tavallin password',
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 520px; margin: 0 auto; color: #1A1A1A;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Password Reset</h1>
            <p style="color: #555; line-height: 1.6;">Hi ${displayName}, we received a request to reset your Tavallin password.</p>
            <a href="${url}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #1A1A1A; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reset Password
            </a>
            <p style="color: #888; font-size: 13px;">This link expires in ${env.PASSWORD_RESET_TOKEN_EXPIRES_MIN} minutes. If you didn't request a password reset, please ignore this email and your account remains secure.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">© ${new Date().getFullYear()} Tavallin · Wear Your Story</p>
          </div>
        `,
        text: `Hi ${displayName},\n\nReset your password: ${url}\n\nExpires in ${env.PASSWORD_RESET_TOKEN_EXPIRES_MIN} minutes.`,
      });

      if (!env.SMTP_HOST) {
        logger.debug({ preview: JSON.stringify(info) }, 'Email (dev mode, not actually sent)');
      }
    } catch (err) {
      logger.error({ err, to }, 'Failed to send password reset email');
    }
  },

  async sendNotificationEmail(
    to: string,
    subject: string,
    body: string,
  ): Promise<void> {
    try {
      await transport.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        text: body,
      });
    } catch (err) {
      logger.error({ err, to }, 'Failed to send notification email');
    }
  },
};
