import nodemailer from 'nodemailer';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

let transporter = null;

export const initializeEmailService = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn('SMTP configuration incomplete. Email notifications will be disabled.');
    return;
  }

  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Timeouts más largos para servicios SMTP lentos
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    logger.info(`SMTP configured: ${smtpHost}:${smtpPort}`);
  } catch (error) {
    logger.error({ error }, 'Failed to create SMTP transporter');
    throw error;
  }
};

export const sendEmail = async (options) => {
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  try {
    const info = await transporter.sendMail(options);
    logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ error: error.message, to: options.to }, 'Failed to send email');
    throw error;
  }
};

export const verifyEmailConnection = async () => {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    return true;
  } catch (error) {
    logger.warn({ error: error.message }, 'SMTP verification failed');
    return false;
  }
};