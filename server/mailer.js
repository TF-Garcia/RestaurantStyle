import nodemailer from 'nodemailer';

const bool = (value) => String(value || '').toLowerCase() === 'true';

const smtpConfig = {
  host: process.env.SmtpHost || process.env.SMTP_HOST,
  port: Number(process.env.SmtpPort || process.env.SMTP_PORT || 587),
  user: process.env.SmtpUser || process.env.SMTP_USER,
  pass: process.env.SmtpPassword || process.env.SMTP_PASSWORD,
  from: process.env.SmtpFrom || process.env.SMTP_FROM,
  displayName: process.env.SmtpDisplayName || process.env.SMTP_DISPLAY_NAME || 'RestaurantStyle',
  secure: bool(process.env.Smtp__EnableSsl || process.env.SMTP_ENABLE_SSL),
};

export const appUrl = process.env.APP_URL || process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5173';

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
