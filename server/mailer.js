import nodemailer from 'nodemailer';

const bool = (value) => String(value || '').toLowerCase() === 'true';

const smtpConfig = {
  host: process.env.EMAIL_HOST || process.env.SmtpHost || process.env.SMTP_HOST,
  port: Number(process.env.EMAIL_PORT || process.env.SmtpPort || process.env.SMTP_PORT || 587),
  user: process.env.EMAIL_USER || process.env.SmtpUser || process.env.SMTP_USER,
  pass: process.env.EMAIL_PASS || process.env.SmtpPassword || process.env.SMTP_PASSWORD,
  from: process.env.EMAIL_FROM || process.env.SmtpFrom || process.env.SMTP_FROM,
  displayName: process.env.EMAIL_DISPLAY_NAME || process.env.SmtpDisplayName || process.env.SMTP_DISPLAY_NAME || 'RestaurantStyle',
  secure: bool(process.env.EMAIL_SECURE || process.env.Smtp__EnableSsl || process.env.SMTP_ENABLE_SSL),
};

export const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5173';

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass || !smtpConfig.from) {
    console.log(`[EMAIL DEV] Para: ${to}\nAssunto: ${subject}\n${text}`);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure || smtpConfig.port === 465,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  return transporter.sendMail({
    from: `"${smtpConfig.displayName}" <${smtpConfig.from}>`,
    to,
    subject,
    text,
    html,
  });
};
