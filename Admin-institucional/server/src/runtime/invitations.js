const nodemailer = require('nodemailer');
const { tokenPattern } = require('./security');

class InvitationError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function allowedTenantOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new InvitationError(400, 'Escribe la URL completa de la instalación de asistencia.');
  }

  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new InvitationError(400, 'Ingresa la URL base de la instalación, sin rutas ni credenciales.');
  }

  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  const development = process.env.NODE_ENV !== 'production';
  if (url.protocol !== 'https:' && !(development && local && url.protocol === 'http:')) {
    throw new InvitationError(400, 'La instalación debe usar HTTPS. HTTP está disponible para pruebas locales.');
  }

  const localDefaults = development ? 'http://127.0.0.1:5173,http://localhost:5173' : '';
  const allowed = (process.env.PLATFORM_TENANT_ORIGINS ?? localDefaults).split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''));
  if (!allowed.includes(url.origin)) {
    throw new InvitationError(400, 'La URL no está habilitada en PLATFORM_TENANT_ORIGINS.');
  }
  return url.origin;
}

async function tenantJson(origin, path, options = {}) {
  try {
    const response = await fetch(new URL(path, origin), {
      ...options,
      redirect: 'error',
      signal: AbortSignal.timeout(options.method === 'POST' ? 6000 : 2000),
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    return { ok: response.ok, status: response.status, data: isJson ? await response.json() : null };
  } catch {
    throw new InvitationError(502, 'No se pudo conectar con la instalación. Revisa la URL y si el servicio está iniciado.');
  }
}

async function issueTenantInvitation(origin, { bootstrapKey, slug, email, name }) {
  const health = await tenantJson(origin, '/api/health');
  if (!health.ok || health.data?.status !== 'ok') {
    throw new InvitationError(502, 'La instalación todavía no responde correctamente en /api/health.');
  }

  const issued = await tenantJson(origin, '/api/auth/invitations/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bootstrapKey}` },
    body: JSON.stringify({ slug, email, name }),
  });
  if (issued.ok && issued.data?.activated === true) return { activated: true };
  if (issued.ok && typeof issued.data?.token === 'string' && tokenPattern.test(issued.data.token)) {
    const activationUrl = new URL('/activar', origin);
    activationUrl.hash = new URLSearchParams({ token: issued.data.token }).toString();
    return { activationUrl: activationUrl.toString() };
  }
  if (issued.status === 401 || issued.status === 403 || issued.status === 404) {
    throw new InvitationError(422, 'Revisa la clave de vinculación y el identificador configurados en la instalación.');
  }
  if (issued.status === 409) {
    throw new InvitationError(409, 'La instalación ya está asociada a otro administrador.');
  }
  throw new InvitationError(502, 'La instalación no pudo generar la invitación.');
}

async function tenantIsActivated(value) {
  try {
    const origin = allowedTenantOrigin(value);
    const response = await tenantJson(origin, '/api/auth/invitations/status');
    return response.ok && response.data?.activated === true;
  } catch (error) {
    if (error instanceof InvitationError) return false;
    throw error;
  }
}

async function deliverInvitation({ email, name, institutionName, appUrl, activationUrl }) {
  if (process.env.PLATFORM_MAIL_TRANSPORT === 'preview' && process.env.NODE_ENV !== 'production') {
    return { status: 'preview', previewUrl: activationUrl };
  }

  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535 || Boolean(user) !== Boolean(pass)) {
    return { status: 'failed' };
  }

  const secure = process.env.SMTP_SECURE === undefined ? port === 465 : process.env.SMTP_SECURE === 'true';
  const transporter = nodemailer.createTransport({
    host, port, secure, requireTLS: !secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 7000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  try {
    const result = await transporter.sendMail({
      from,
      to: { address: email },
      subject: 'Activa tu cuenta de asistencia',
      text: [
        `Hola, ${name}.`,
        '',
        `El espacio de asistencia de ${institutionName} está listo. Tu usuario es ${email}.`,
        '',
        `Activa tu cuenta y crea tu contraseña con este enlace de un solo uso: ${activationUrl}`,
        '',
        `Después puedes entrar en ${appUrl}/login.`,
      ].join('\n'),
    });
    return { status: result.accepted.length > 0 ? 'sent' : 'failed' };
  } catch {
    return { status: 'failed' };
  } finally {
    transporter.close();
  }
}

module.exports = { InvitationError, allowedTenantOrigin, deliverInvitation, issueTenantInvitation, tenantIsActivated };
