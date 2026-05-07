import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const dataDir = path.join(process.cwd(), 'server', 'data');
const dbPath = path.join(dataDir, 'restaurant.sqlite');

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const json = (value) => JSON.stringify(value);

export const defaultConfig = {
  name: 'Maison Aurora',
  tagline: 'Cozinha autoral, hospitalidade precisa e noites memoraveis.',
  whatsapp: '5511999999999',
  address: 'Rua Harmonia, 1280 - Vila Madalena, Sao Paulo - SP',
  hours: 'Terca a quinta, 12h as 23h. Sexta e sabado, 12h as 00h. Domingo, 12h as 17h.',
  instagram: '@maisonaurora',
  heroImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=85',
  aboutImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85',
  socialImage: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=85',
  institutionalText: 'Um restaurante contemporaneo criado para encontros importantes, almocos executivos elegantes e celebracoes ao redor de uma mesa impecavel.',
  reservationSettings: { averageDurationMinutes: 90, slotStepMinutes: 30, defaultCapacityPerSlot: 36, autoConfirmPayAtLocation: false },
  paymentSettings: { reservationFee: 0.5, allowPayAtLocation: true, acceptedMethods: ['pix', 'credit_card', 'debit_card', 'pay_at_delivery', 'pay_at_location'], provider: 'mercado_pago_sandbox' },
  cancellationPolicy: { fullRefundHoursBefore: 24, partialRefundHoursBefore: 6, lateRetentionPercentage: 100, noShowRetentionPercentage: 100 },
};

export const migrate = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('client','admin')),
      email_verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS restaurant_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      address TEXT NOT NULL,
      hours TEXT NOT NULL,
      instagram TEXT NOT NULL,
      hero_image TEXT NOT NULL,
      about_image TEXT NOT NULL,
      social_image TEXT NOT NULL,
      institutional_text TEXT NOT NULL,
      reservation_settings TEXT NOT NULL,
      payment_settings TEXT NOT NULL,
      cancellation_policy TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opening_hours (
      id TEXT PRIMARY KEY,
      day_of_week INTEGER NOT NULL UNIQUE,
      is_open INTEGER NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      capacity_per_slot INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservation_intervals (
      id TEXT PRIMARY KEY,
      opening_hour_id TEXT NOT NULL REFERENCES opening_hours(id) ON DELETE CASCADE,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id TEXT PRIMARY KEY,
      opening_hour_id TEXT NOT NULL REFERENCES opening_hours(id) ON DELETE CASCADE,
      time TEXT NOT NULL,
      UNIQUE(opening_hour_id, time)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      active INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      image TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id),
      featured INTEGER NOT NULL,
      available INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      date TEXT NOT NULL,
      day_name TEXT NOT NULL,
      time TEXT NOT NULL,
      table_name TEXT NOT NULL DEFAULT 'A definir',
      party_size INTEGER NOT NULL CHECK (party_size > 0),
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_id TEXT,
      amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_slot ON reservations(date, time);

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
      order_id TEXT,
      method TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_reference TEXT NOT NULL,
      checkout_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL REFERENCES payments(id),
      reservation_id TEXT REFERENCES reservations(id),
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_id TEXT,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      total REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price REAL NOT NULL,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      previous_value TEXT,
      new_value TEXT,
      performed_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
};

const insertOpeningHour = db.transaction((day) => {
  const id = randomUUID();
  db.prepare('INSERT INTO opening_hours (id, day_of_week, is_open, open_time, close_time, capacity_per_slot) VALUES (?, ?, ?, ?, ?, ?)').run(id, day.dayOfWeek, day.isOpen ? 1 : 0, day.openTime, day.closeTime, day.capacityPerSlot);
  for (const interval of day.reservationIntervals) {
    db.prepare('INSERT INTO reservation_intervals (id, opening_hour_id, start_time, end_time) VALUES (?, ?, ?, ?)').run(randomUUID(), id, interval.startTime, interval.endTime);
  }
  for (const time of day.blockedSlots) {
    db.prepare('INSERT INTO blocked_slots (id, opening_hour_id, time) VALUES (?, ?, ?)').run(randomUUID(), id, time);
  }
});

export const seed = () => {
  const now = new Date().toISOString();
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (!userCount) {
    db.prepare('INSERT INTO users (id, name, email, password_hash, role, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('admin-001', 'Administrador', 'admin@restaurante.com', bcrypt.hashSync('admin123', 12), 'admin', now, now, now);
  }

  if (!db.prepare('SELECT COUNT(*) AS count FROM restaurant_config').get().count) {
    db.prepare(`INSERT INTO restaurant_config (id, name, tagline, whatsapp, address, hours, instagram, hero_image, about_image, social_image, institutional_text, reservation_settings, payment_settings, cancellation_policy, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(defaultConfig.name, defaultConfig.tagline, defaultConfig.whatsapp, defaultConfig.address, defaultConfig.hours, defaultConfig.instagram, defaultConfig.heroImage, defaultConfig.aboutImage, defaultConfig.socialImage, defaultConfig.institutionalText, json(defaultConfig.reservationSettings), json(defaultConfig.paymentSettings), json(defaultConfig.cancellationPolicy), now);
  }

  if (!db.prepare('SELECT COUNT(*) AS count FROM opening_hours').get().count) {
    [
      { dayOfWeek: 0, isOpen: true, openTime: '12:00', closeTime: '17:00', reservationIntervals: [{ startTime: '12:00', endTime: '15:30' }], capacityPerSlot: 42, blockedSlots: [] },
      { dayOfWeek: 1, isOpen: false, openTime: '12:00', closeTime: '23:00', reservationIntervals: [], capacityPerSlot: 0, blockedSlots: [] },
      { dayOfWeek: 2, isOpen: true, openTime: '12:00', closeTime: '23:00', reservationIntervals: [{ startTime: '12:00', endTime: '15:00' }, { startTime: '18:30', endTime: '21:30' }], capacityPerSlot: 36, blockedSlots: [] },
      { dayOfWeek: 3, isOpen: true, openTime: '12:00', closeTime: '23:00', reservationIntervals: [{ startTime: '12:00', endTime: '15:00' }, { startTime: '18:30', endTime: '21:30' }], capacityPerSlot: 36, blockedSlots: [] },
      { dayOfWeek: 4, isOpen: true, openTime: '12:00', closeTime: '23:00', reservationIntervals: [{ startTime: '12:00', endTime: '15:00' }, { startTime: '18:30', endTime: '21:30' }], capacityPerSlot: 36, blockedSlots: [] },
      { dayOfWeek: 5, isOpen: true, openTime: '12:00', closeTime: '00:00', reservationIntervals: [{ startTime: '12:00', endTime: '15:00' }, { startTime: '18:30', endTime: '22:30' }], capacityPerSlot: 48, blockedSlots: ['20:00'] },
      { dayOfWeek: 6, isOpen: true, openTime: '12:00', closeTime: '00:00', reservationIntervals: [{ startTime: '12:00', endTime: '15:00' }, { startTime: '18:30', endTime: '22:30' }], capacityPerSlot: 48, blockedSlots: [] },
    ].forEach(insertOpeningHour);
  }

  if (!db.prepare('SELECT COUNT(*) AS count FROM categories').get().count) {
    const categories = [
      ['carnes', 'Carnes', 'Cortes nobres, brasa e molhos classicos.', 1],
      ['massas', 'Massas', 'Receitas artesanais com finalizacao elegante.', 2],
      ['pizzas', 'Pizzas', 'Fermentacao longa e coberturas premium.', 3],
      ['sushi', 'Sushi', 'Selecao fria com peixes frescos e autorais.', 4],
      ['bebidas', 'Bebidas', 'Drinks, vinhos, cafes e nao alcoolicos.', 5],
      ['sobremesas', 'Sobremesas', 'Finais delicados para compartilhar.', 6],
      ['executivo', 'Executivo', 'Combinacoes completas para a semana.', 7],
    ];
    for (const category of categories) db.prepare('INSERT INTO categories (id, name, description, active, sort_order) VALUES (?, ?, ?, 1, ?)').run(...category);
  }

  if (!db.prepare('SELECT COUNT(*) AS count FROM menu_items').get().count) {
    const items = [
      ['bife-ancho', 'Bife Ancho ao Malbec', 'Ancho grelhado, jus de malbec, batatas douradas e legumes tostados.', 98, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=85', 'carnes', 1],
      ['risotto-funghi', 'Risotto de Funghi e Parmesao', 'Arroz carnaroli, mix de cogumelos, parmesao curado e azeite trufado.', 72, 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=1000&q=85', 'massas', 1],
      ['pizza-burrata', 'Pizza Burrata & Parma', 'Molho da casa, burrata cremosa, presunto parma, rucula e pesto.', 89, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1000&q=85', 'pizzas', 1],
      ['combinado-aurora', 'Combinado Aurora', 'Selecao de sashimis, niguiris e uramakis autorais para duas pessoas.', 136, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=85', 'sushi', 0],
      ['negroni-olive', 'Negroni Olive', 'Gin, vermute, bitter italiano e toque aromatico de oliva.', 38, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1000&q=85', 'bebidas', 0],
      ['tarte-caramelo', 'Tarte de Caramelo Salgado', 'Massa amanteigada, ganache amarga, caramelo salgado e flor de sal.', 34, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1000&q=85', 'sobremesas', 1],
      ['executivo-salmao', 'Executivo Salmao Citrus', 'Salmao grelhado, arroz de ervas, salada sazonal e molho citrus.', 59, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=85', 'executivo', 0],
    ];
    for (const item of items) db.prepare('INSERT INTO menu_items (id, name, description, price, image, category_id, featured, available) VALUES (?, ?, ?, ?, ?, ?, ?, 1)').run(...item);
  }
};

export const initDb = () => {
  migrate();
  seed();
};

export const readConfig = () => {
  const row = db.prepare('SELECT * FROM restaurant_config WHERE id = 1').get();
  const openingRows = db.prepare('SELECT * FROM opening_hours ORDER BY day_of_week').all();
  const openingHours = openingRows.map((hour) => ({
    dayOfWeek: hour.day_of_week,
    isOpen: Boolean(hour.is_open),
    openTime: hour.open_time,
    closeTime: hour.close_time,
    capacityPerSlot: hour.capacity_per_slot,
    reservationIntervals: db.prepare('SELECT start_time AS startTime, end_time AS endTime FROM reservation_intervals WHERE opening_hour_id = ? ORDER BY start_time').all(hour.id),
    blockedSlots: db.prepare('SELECT time FROM blocked_slots WHERE opening_hour_id = ? ORDER BY time').all(hour.id).map((slot) => slot.time),
  }));
  return {
    name: row.name,
    tagline: row.tagline,
    whatsapp: row.whatsapp,
    address: row.address,
    hours: row.hours,
    instagram: row.instagram,
    heroImage: row.hero_image,
    aboutImage: row.about_image,
    socialImage: row.social_image,
    institutionalText: row.institutional_text,
    reservationCapacity: openingHours.reduce((max, hour) => Math.max(max, hour.capacityPerSlot), 0),
    openingHours,
    reservationSettings: JSON.parse(row.reservation_settings),
    paymentSettings: JSON.parse(row.payment_settings),
    cancellationPolicy: JSON.parse(row.cancellation_policy),
  };
};

export const mapReservation = (row) => ({
  id: row.id,
  userId: row.user_id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  customerEmail: row.customer_email,
  date: row.date,
  dayName: row.day_name,
  time: row.time,
  tableName: row.table_name,
  partySize: row.party_size,
  notes: row.notes,
  status: row.status,
  paymentStatus: row.payment_status,
  paymentMethod: row.payment_method,
  paymentId: row.payment_id,
  amount: row.amount,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapPayment = (row) => ({
  id: row.id,
  reservationId: row.reservation_id,
  orderId: row.order_id,
  method: row.method,
  amount: row.amount,
  status: row.status,
  provider: row.provider,
  providerReference: row.provider_reference,
  checkoutUrl: row.checkout_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  auditTrail: [],
});
