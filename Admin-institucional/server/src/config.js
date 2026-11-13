function databaseUrl() {
  const url = process.env.PLATFORM_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('Configura PLATFORM_DATABASE_URL con la base de datos de la plataforma.');
  return url;
}

function httpAddress() {
  const host = process.env.HOST?.trim() || process.env.PLATFORM_HOST?.trim() || '127.0.0.1';
  const port = Number(process.env.PORT ?? '4300');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }
  return { host, port };
}

module.exports = { databaseUrl, httpAddress };
