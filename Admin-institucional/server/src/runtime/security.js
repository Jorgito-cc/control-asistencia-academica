const { createHash, randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { transaction } = require('./db');

const deriveKey = promisify(scrypt);
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const cookieName = 'asistencia_platform_session';
const sessionLifetime = 8 * 60 * 60 * 1000;
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

function newToken() {
  return randomBytes(32).toString('base64url');
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest();
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, 64, scryptOptions);
  return `scrypt:${salt.toString('base64url')}:${key.toString('base64url')}`;
}

async function checkPassword(password, hash) {
  const [algorithm, salt, stored] = hash.split(':');
  if (algorithm !== 'scrypt' || !salt || !stored) return false;
  const expected = Buffer.from(stored, 'base64url');
  if (expected.length !== 64) return false;
  const key = await deriveKey(password, Buffer.from(salt, 'base64url'), 64, scryptOptions);
  return timingSafeEqual(key, expected);
}

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function configuredAdmin() {
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Operador';
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ?? '';
  const password = process.env.PLATFORM_ADMIN_PASSWORD ?? '';
  if (name.length > 120 || !validEmail(email) || password.length < 12 || password.length > 256) {
    throw new Error('Configura un correo válido, un nombre de hasta 120 caracteres y una contraseña de 12 a 256 caracteres para el operador.');
  }
  return { name, email, password };
}

async function bootstrapAdmin(pool, { name, email, password }) {
  await transaction(pool, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(4300002)');
    const { rows: [existing] } = await client.query('SELECT * FROM platform_admin WHERE id = 1 FOR UPDATE');
    if (existing && existing.email === email && await checkPassword(password, existing.password_hash)) {
      if (existing.name !== name) await client.query('UPDATE platform_admin SET name = $1 WHERE id = 1', [name]);
      return;
    }
    const passwordHash = await hashPassword(password);
    await client.query(`
      INSERT INTO platform_admin (id, name, email, password_hash)
      VALUES (1, $1, $2, $3)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
          credential_version = platform_admin.credential_version + 1
    `, [name, email, passwordHash]);
    await client.query('DELETE FROM platform_sessions WHERE admin_id = 1');
  });
}

function readSessionHash(request) {
  const prefix = `${cookieName}=`;
  const cookie = request.headers.cookie?.split(';').map((value) => value.trim())
    .find((value) => value.startsWith(prefix));
  const token = cookie?.slice(prefix.length);
  return token && tokenPattern.test(token) ? tokenHash(token) : null;
}

function cookieOptions() {
  const secure = process.env.PLATFORM_COOKIE_SECURE === undefined
    ? process.env.NODE_ENV === 'production'
    : process.env.PLATFORM_COOKIE_SECURE === 'true';
  return { httpOnly: true, secure, sameSite: 'strict', path: '/api/platform' };
}

async function openSession(pool, request, response, email, password) {
  const { rows: [admin] } = await pool.query('SELECT * FROM platform_admin WHERE id = 1');
  if (!admin || !(await checkPassword(password, admin.password_hash)) || admin.email !== email) return null;
  const token = newToken();
  const priorHash = readSessionHash(request);
  await transaction(pool, async (client) => {
    await client.query('DELETE FROM platform_sessions WHERE expires_at <= now() OR token_hash = $1', [priorHash]);
    await client.query(`
      INSERT INTO platform_sessions (token_hash, admin_id, credential_version, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [tokenHash(token), admin.id, admin.credential_version, new Date(Date.now() + sessionLifetime)]);
  });
  response.cookie(cookieName, token, { ...cookieOptions(), maxAge: sessionLifetime });
  return { name: admin.name, email: admin.email };
}

async function sessionUser(pool, request) {
  const hash = readSessionHash(request);
  if (!hash) return null;
  const { rows: [user] } = await pool.query(`
    SELECT a.name, a.email
    FROM platform_sessions s
    JOIN platform_admin a ON a.id = s.admin_id AND a.credential_version = s.credential_version
    WHERE s.token_hash = $1 AND s.expires_at > now()
  `, [hash]);
  return user ?? null;
}

async function closeSession(pool, request, response) {
  await pool.query('DELETE FROM platform_sessions WHERE token_hash = $1', [readSessionHash(request)]);
  response.clearCookie(cookieName, cookieOptions());
}

function limitLogins() {
  const attempts = new Map();
  let resetsAt = 0;
  let total = 0;
  return (request, response, next) => {
    const now = Date.now();
    if (now >= resetsAt) {
      attempts.clear();
      resetsAt = now + 60_000;
      total = 0;
    }
    const key = request.ip;
    const count = attempts.get(key) ?? 0;
    if (count >= 10 || total >= 100) {
      response.set('Retry-After', String(Math.ceil((resetsAt - now) / 1000)));
      return response.status(429).json({ message: 'Demasiados intentos. Vuelve a intentar en un minuto.' });
    }
    attempts.set(key, count + 1);
    total++;
    next();
  };
}

module.exports = {
  bootstrapAdmin, configuredAdmin, closeSession, limitLogins, newToken,
  openSession, sessionUser, tokenHash, tokenPattern, validEmail,
};
