import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { z } from 'zod';
import { db, initDb, mapPayment, mapReservation, readConfig } from './db.js';
import { appUrl, sendEmail } from './mailer.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'dev-only-change-this-secret-in-production';
const csrfCookieName = 'csrf_token';
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  process.env.APP_URL,
].filter(Boolean);
const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
const mpClient = mercadoPagoToken ? new MercadoPagoConfig({ accessToken: mercadoPagoToken }) : null;

initDb();

const now = () => new Date().toISOString();
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
const addHours = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const genericAuthMessage = 'Credenciais invalidas ou conta pendente de verificacao.';
const dayNames = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];

const sanitizeUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: Boolean(user.email_verified_at) });
const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '8h' });
const authCookieOptions = { httpOnly: true, sameSite: isProduction ? 'none' : 'lax', secure: isProduction, maxAge: 8 * 60 * 60 * 1000 };
const csrfCookieOptions = { sameSite: isProduction ? 'none' : 'lax', secure: isProduction };

const audit = (entityType, entityId, action, performedBy, previousValue = null, newValue = null) =>
  db.prepare('INSERT INTO audit_logs (id, entity_type, entity_id, action, previous_value, new_value, performed_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), entityType, entityId, action, previousValue, newValue, performedBy, now());

const minutesOf = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};
const toTime = (value) => `${Math.floor((((value % 1440) + 1440) % 1440) / 60).toString().padStart(2, '0')}:${((((value % 1440) + 1440) % 1440) % 60).toString().padStart(2, '0')}`;
const getOpeningHour = (date, config) => config.openingHours.find((item) => item.dayOfWeek === new Date(`${date}T00:00:00`).getDay());
const getSlots = (config, date) => {
  const opening = getOpeningHour(date, config);
  if (!opening?.isOpen) return [];
  const latestStart = minutesOf(opening.closeTime) - config.reservationSettings.averageDurationMinutes;
  return opening.reservationIntervals.flatMap((interval) => {
    const slots = [];
    for (let current = minutesOf(interval.startTime); current <= Math.min(minutesOf(interval.endTime), latestStart); current += config.reservationSettings.slotStepMinutes) {
      const slot = toTime(current);
      if (!opening.blockedSlots.includes(slot)) slots.push(slot);
    }
    return slots;
  });
};
const getAvailability = (date, time) => {
  const config = readConfig();
  const opening = getOpeningHour(date, config);
  const totalCapacity = opening?.capacityPerSlot || config.reservationSettings.defaultCapacityPerSlot;
  const reservedSeats = db.prepare("SELECT COALESCE(SUM(party_size), 0) AS seats FROM reservations WHERE date = ? AND time = ? AND status NOT IN ('cancelled','no_show')").get(date, time).seats;
  return { totalCapacity, reservedSeats, availableSeats: Math.max(totalCapacity - reservedSeats, 0) };
};

const createEmailToken = (userId, table, hours) => {
  const token = randomBytes(32).toString('hex');
  db.prepare(`INSERT INTO ${table} (token_hash, user_id, expires_at) VALUES (?, ?, ?)`).run(tokenHash(token), userId, addHours(hours));
  return token;
};

const createPayment = async ({ reservationId = null, orderId = null, method, amount, description }) => {
  const id = randomUUID();
  let providerReference = `sandbox-${method}-${Date.now()}`;
  let checkoutUrl = `/checkout/sandbox/${id}`;

  if (mpClient && ['pix', 'credit_card', 'debit_card'].includes(method)) {
    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: [{ id, title: description, quantity: 1, unit_price: Number(amount), currency_id: 'BRL' }],
        external_reference: id,
        notification_url: process.env.MP_WEBHOOK_URL || undefined,
      },
    });
    providerReference = response.id || providerReference;
    checkoutUrl = response.sandbox_init_point || response.init_point || checkoutUrl;
  }

  const status = ['pay_at_location', 'pay_at_delivery'].includes(method) ? 'unpaid' : 'pending';
  db.prepare(`INSERT INTO payments (id, reservation_id, order_id, method, amount, status, provider, provider_reference, checkout_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, reservationId, orderId, method, amount, status, 'mercado_pago_sandbox', providerReference, checkoutUrl, now(), now());
  return mapPayment(db.prepare('SELECT * FROM payments WHERE id = ?').get(id));
};

const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies.session;
    if (!token) return res.status(401).json({ message: 'Autenticacao obrigatoria.' });
    const payload = jwt.verify(token, jwtSecret);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ message: 'Sessao invalida.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }
};
const requireRole = (role) => (req, res, next) => (req.user?.role === role ? next() : res.status(403).json({ message: 'Acesso negado.' }));
const requireVerified = (req, res, next) => (req.user.email_verified_at || req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Confirme seu email para usar esta funcionalidade.' }));
const csrf = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path.startsWith('/api/payments/webhook')) return next();
  const cookie = req.cookies[csrfCookieName];
  if (!cookie || cookie !== req.get('x-csrf-token')) return res.status(403).json({ message: 'Requisicao invalida.' });
  next();
};

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem nao permitida pelo CORS.'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '80kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (!req.cookies[csrfCookieName]) res.cookie(csrfCookieName, randomBytes(24).toString('hex'), csrfCookieOptions);
  next();
});
app.use('/api', csrf);

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: { message: 'Muitas tentativas. Tente novamente mais tarde.' } });
const emailSchema = z.string().trim().email().max(120).transform((value) => value.toLowerCase());
const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: emailSchema, password: z.string().min(8).max(128) });
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
const reservationSchema = z.object({ customerPhone: z.string().trim().min(8).max(30), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), partySize: z.number().int().min(1).max(30), notes: z.string().trim().max(500).optional().default(''), paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'pay_at_location']) });
const orderSchema = z.object({ customerPhone: z.string().trim().min(8).max(30), deliveryAddress: z.string().trim().min(8).max(220), deliveryNotes: z.string().trim().max(500).optional().default(''), paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'pay_at_delivery']), items: z.array(z.object({ menuItemId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1) });

app.get('/api/bootstrap', (_req, res) => {
  const categories = db.prepare('SELECT id, name, description, active, sort_order AS "order" FROM categories ORDER BY sort_order').all().map((item) => ({ ...item, active: Boolean(item.active) }));
  const menuItems = db.prepare('SELECT id, name, description, price, image, category_id AS categoryId, featured, available FROM menu_items ORDER BY name').all().map((item) => ({ ...item, featured: Boolean(item.featured), available: Boolean(item.available) }));
  res.json({ config: readConfig(), categories, menuItems });
});

app.post('/api/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados invalidos.' });
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.email)) return res.status(409).json({ message: 'Nao foi possivel criar a conta.' });
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, parsed.data.name, parsed.data.email, await bcrypt.hash(parsed.data.password, 12), 'client', now(), now());
  const token = createEmailToken(id, 'email_verification_tokens', 24);
  await sendEmail({
    to: parsed.data.email,
    subject: 'Confirme seu email',
    text: `Confirme sua conta acessando: ${appUrl}/confirmar-email?token=${token}`,
    html: `<p>Confirme sua conta acessando:</p><p><a href="${appUrl}/confirmar-email?token=${token}">Confirmar email</a></p>`,
  });
  res.status(201).json({ message: 'Cadastro criado. Verifique seu email para liberar a conta.' });
});

app.get('/api/auth/verify-email', (req, res) => {
  const token = String(req.query.token || '');
  const row = db.prepare('SELECT * FROM email_verification_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').get(tokenHash(token), now());
  if (!row) return res.status(400).json({ message: 'Token invalido ou expirado.' });
  db.prepare('UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), row.user_id);
  db.prepare('UPDATE email_verification_tokens SET used_at = ? WHERE token_hash = ?').run(now(), row.token_hash);
  res.json({ message: 'Email confirmado. Voce ja pode entrar.' });
});

app.post('/api/auth/resend-verification', loginLimiter, async (req, res) => {
  const parsed = z.object({ email: emailSchema }).safeParse(req.body);
  if (parsed.success) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email);
    if (user && !user.email_verified_at) {
      const token = createEmailToken(user.id, 'email_verification_tokens', 24);
      await sendEmail({
        to: user.email,
        subject: 'Confirme seu email',
        text: `Confirme sua conta acessando: ${appUrl}/confirmar-email?token=${token}`,
        html: `<p>Confirme sua conta acessando:</p><p><a href="${appUrl}/confirmar-email?token=${token}">Confirmar email</a></p>`,
      });
    }
  }
  res.json({ message: 'Se houver uma conta pendente para este email, enviaremos uma nova confirmacao.' });
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ message: genericAuthMessage });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email);
  const ok = user ? await bcrypt.compare(parsed.data.password, user.password_hash) : false;
  if (!ok || (!user.email_verified_at && user.role !== 'admin')) return res.status(401).json({ message: genericAuthMessage });
  res.cookie('session', signToken(user), authCookieOptions).json({ user: sanitizeUser(user) });
});
app.post('/api/auth/logout', (_req, res) => res.clearCookie('session', authCookieOptions).json({ ok: true }));
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: sanitizeUser(req.user) }));
app.post('/api/auth/forgot-password', async (req, res) => {
  const parsed = z.object({ email: emailSchema }).safeParse(req.body);
  if (parsed.success) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email);
    if (user) {
      const token = createEmailToken(user.id, 'password_reset_tokens', 1);
      await sendEmail({
        to: user.email,
        subject: 'Redefinir senha',
        text: `Redefina sua senha acessando: ${appUrl}/redefinir-senha?token=${token}`,
        html: `<p>Redefina sua senha acessando:</p><p><a href="${appUrl}/redefinir-senha?token=${token}">Redefinir senha</a></p>`,
      });
    }
  }
  res.json({ message: 'Se o email existir, enviaremos instrucoes de recuperacao.' });
});
app.post('/api/auth/reset-password', async (req, res) => {
  const parsed = z.object({ token: z.string().min(20), password: z.string().min(8).max(128) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados invalidos.' });
  const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').get(tokenHash(parsed.data.token), now());
  if (!row) return res.status(400).json({ message: 'Token invalido ou expirado.' });
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(await bcrypt.hash(parsed.data.password, 12), now(), row.user_id);
  db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?').run(now(), row.token_hash);
  res.json({ message: 'Senha atualizada.' });
});

app.get('/api/me/reservations', requireAuth, requireRole('client'), (req, res) => res.json({ reservations: db.prepare('SELECT * FROM reservations WHERE user_id = ? ORDER BY date DESC, time DESC').all(req.user.id).map(mapReservation) }));
app.post('/api/me/reservations', requireAuth, requireRole('client'), requireVerified, async (req, res) => {
  const parsed = reservationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados invalidos.' });
  const config = readConfig();
  if (!getSlots(config, parsed.data.date).includes(parsed.data.time)) return res.status(409).json({ message: 'Horario indisponivel.' });
  const amount = ['pix', 'credit_card', 'debit_card'].includes(parsed.data.paymentMethod) ? 0.5 : 0;
  const reservationId = randomUUID();
  const payment = await createPayment({ reservationId, method: parsed.data.paymentMethod, amount, description: 'Taxa de reserva' });
  const dateObj = new Date(`${parsed.data.date}T00:00:00`);
  const insertReservation = db.transaction(() => {
    const availability = getAvailability(parsed.data.date, parsed.data.time);
    if (parsed.data.partySize > availability.availableSeats) throw new Error('capacity');
    db.prepare(`INSERT INTO reservations (id, user_id, customer_name, customer_phone, customer_email, date, day_name, time, table_name, party_size, notes, status, payment_status, payment_method, payment_id, amount, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(reservationId, req.user.id, req.user.name, parsed.data.customerPhone, req.user.email, parsed.data.date, dayNames[dateObj.getDay()], parsed.data.time, 'A definir', parsed.data.partySize, parsed.data.notes, 'pending', payment.status, parsed.data.paymentMethod, payment.id, amount, now(), now());
  });
  try {
    insertReservation();
  } catch (error) {
    if (error instanceof Error && error.message === 'capacity') return res.status(409).json({ message: 'Nao ha lugares suficientes para este horario.' });
    throw error;
  }
  audit('reservation', reservationId, 'reserva_criada', req.user.id);
  res.status(201).json({ reservation: mapReservation(db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId)), payment });
});
app.patch('/api/me/reservations/:id/cancel', requireAuth, requireRole('client'), (req, res) => {
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!reservation) return res.status(404).json({ message: 'Reserva nao encontrada.' });
  if (!['pending', 'confirmed'].includes(reservation.status)) return res.status(409).json({ message: 'Acao ja realizada ou nao permitida.' });
  db.prepare("UPDATE reservations SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now(), reservation.id);
  audit('reservation', reservation.id, 'cliente_cancelou_reserva', req.user.id, reservation.status, 'cancelled');
  res.json({ reservation: mapReservation(db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservation.id)) });
});

app.get('/api/admin/reservations', requireAuth, requireRole('admin'), (_req, res) => res.json({ reservations: db.prepare('SELECT * FROM reservations ORDER BY date DESC, time DESC').all().map(mapReservation) }));
app.patch('/api/admin/reservations/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const parsed = z.object({ status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados invalidos.' });
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!reservation) return res.status(404).json({ message: 'Reserva nao encontrada.' });
  if (['cancelled', 'completed', 'no_show'].includes(reservation.status)) return res.status(409).json({ message: 'Acao definitiva ja registrada.' });
  if (parsed.data.status === 'confirmed' && reservation.payment_method !== 'pay_at_location' && reservation.payment_status !== 'paid') return res.status(409).json({ message: 'Pagamento ainda nao confirmado.' });
  db.prepare('UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?').run(parsed.data.status, now(), reservation.id);
  audit('reservation', reservation.id, `admin_alterou_status_para_${parsed.data.status}`, req.user.id, reservation.status, parsed.data.status);
  res.json({ reservation: mapReservation(db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservation.id)) });
});

app.get('/api/admin/payments', requireAuth, requireRole('admin'), (_req, res) => {
  const payments = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all().map(mapPayment);
  const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  res.json({ payments, auditLogs });
});

app.post('/api/admin/payments/:id/sandbox-paid', requireAuth, requireRole('admin'), (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Pagamento nao encontrado.' });
  if (payment.status !== 'pending') return res.status(409).json({ message: 'Acao ja realizada ou nao permitida.' });
  db.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?').run('paid', now(), payment.id);
  if (payment.reservation_id) db.prepare('UPDATE reservations SET payment_status = ?, status = "confirmed", updated_at = ? WHERE id = ?').run('paid', now(), payment.reservation_id);
  if (payment.order_id) db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run('paid', now(), payment.order_id);
  audit('payment', payment.id, 'sandbox_pagamento_confirmado', req.user.id, payment.status, 'paid');
  res.json({ payment: db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id) });
});

app.post('/api/admin/payments/:id/refund', requireAuth, requireRole('admin'), (req, res) => {
  const parsed = z.object({ reason: z.string().trim().min(3).max(240), amount: z.number().positive().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados invalidos.' });
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Pagamento nao encontrado.' });
  if (payment.status !== 'paid') return res.status(409).json({ message: 'Pagamento nao permite estorno ou ja foi estornado.' });
  const amount = Math.min(parsed.data.amount ?? payment.amount, payment.amount);
  const refundStatus = amount >= payment.amount ? 'refunded' : 'partially_refunded';
  const refundId = randomUUID();
  db.prepare('INSERT INTO refunds (id, payment_id, reservation_id, amount, reason, status, requested_by, created_at, processed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(refundId, payment.id, payment.reservation_id, amount, parsed.data.reason, 'processed', req.user.id, now(), now());
  db.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?').run(refundStatus, now(), payment.id);
  if (payment.reservation_id) db.prepare('UPDATE reservations SET payment_status = ?, updated_at = ? WHERE id = ?').run(refundStatus, now(), payment.reservation_id);
  if (payment.order_id) db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run(refundStatus, now(), payment.order_id);
  audit('refund', refundId, 'estorno_manual_processado', req.user.id, payment.status, refundStatus);
  res.json({ refund: db.prepare('SELECT * FROM refunds WHERE id = ?').get(refundId), payment: db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id) });
});

app.post('/api/payments/webhook/mercado-pago', (req, res) => {
  const externalReference = req.body?.data?.id || req.body?.external_reference || req.body?.id;
  const status = req.body?.status === 'approved' || req.body?.action === 'payment.updated' ? 'paid' : 'pending';
  const payment = db.prepare('SELECT * FROM payments WHERE provider_reference = ? OR id = ?').get(externalReference, externalReference);
  if (payment && payment.status !== status) {
    db.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), payment.id);
    if (payment.reservation_id) db.prepare('UPDATE reservations SET payment_status = ?, status = CASE WHEN ? = "paid" THEN "confirmed" ELSE status END, updated_at = ? WHERE id = ?').run(status, status, now(), payment.reservation_id);
    if (payment.order_id) db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run(status, now(), payment.order_id);
    audit('payment', payment.id, 'webhook_mercado_pago', 'mercado_pago', payment.status, status);
  }
  res.json({ received: true });
});

app.get('/api/me/orders', requireAuth, requireRole('client'), (req, res) => res.json({ orders: db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id) }));
app.post('/api/me/orders', requireAuth, requireRole('client'), requireVerified, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados invalidos.' });
  const menuIds = parsed.data.items.map((item) => item.menuItemId);
  const menu = db.prepare(`SELECT * FROM menu_items WHERE id IN (${menuIds.map(() => '?').join(',')}) AND available = 1`).all(...menuIds);
  if (menu.length !== new Set(menuIds).size) return res.status(400).json({ message: 'Item indisponivel no cardapio.' });
  const subtotal = parsed.data.items.reduce((sum, item) => sum + menu.find((menuItem) => menuItem.id === item.menuItemId).price * item.quantity, 0);
  const deliveryFee = 8;
  const total = subtotal + deliveryFee;
  const orderId = randomUUID();
  const payment = await createPayment({ orderId, method: parsed.data.paymentMethod, amount: ['pix', 'credit_card', 'debit_card'].includes(parsed.data.paymentMethod) ? total : 0, description: 'Pedido online' });
  db.prepare(`INSERT INTO orders (id, user_id, customer_name, customer_phone, customer_email, delivery_address, delivery_notes, status, payment_status, payment_method, payment_id, subtotal, delivery_fee, total, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?)`).run(orderId, req.user.id, req.user.name, parsed.data.customerPhone, req.user.email, parsed.data.deliveryAddress, parsed.data.deliveryNotes, payment.status, parsed.data.paymentMethod, payment.id, subtotal, deliveryFee, total, now(), now());
  for (const item of parsed.data.items) {
    const menuItem = menu.find((current) => current.id === item.menuItemId);
    db.prepare('INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), orderId, item.menuItemId, menuItem.name, item.quantity, menuItem.price, menuItem.price * item.quantity);
  }
  audit('order', orderId, 'pedido_criado', req.user.id);
  res.status(201).json({ order: db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId), payment });
});
app.get('/api/admin/orders', requireAuth, requireRole('admin'), (_req, res) => res.json({ orders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() }));
app.patch('/api/admin/orders/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const parsed = z.object({ status: z.enum(['received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados invalidos.' });
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'Pedido nao encontrado.' });
  if (['delivered', 'cancelled'].includes(order.status)) return res.status(409).json({ message: 'Acao definitiva ja registrada.' });
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(parsed.data.status, now(), order.id);
  audit('order', order.id, `admin_alterou_pedido_para_${parsed.data.status}`, req.user.id, order.status, parsed.data.status);
  res.json({ order: db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id) });
});

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}
app.listen(port, '0.0.0.0', () => console.log(`API listening on http://0.0.0.0:${port}`));
