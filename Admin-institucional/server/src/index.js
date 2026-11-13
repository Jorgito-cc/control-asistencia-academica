const { createServer } = require('node:http');
const { once } = require('node:events');
const { databaseUrl, httpAddress } = require('./config');
const { openPlatform } = require('./runtime/server');

async function main() {
  const address = httpAddress();
  const platform = await openPlatform(databaseUrl(), true);
  const server = createServer(platform.handle);

  try {
    const listening = once(server, 'listening');
    server.listen(address);
    await listening;
  } catch (error) {
    await platform.close();
    throw error;
  }
  console.log(`API de plataforma en ${address.host}:${address.port}`);

  let closing = false;
  function shutdown() {
    if (closing) return;
    closing = true;
    server.close(async () => {
      try {
        await platform.close();
      } catch (error) {
        console.error('Error al cerrar la base de datos de plataforma.', error.code ?? error.name);
        process.exitCode = 1;
      }
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('No se pudo iniciar la API de plataforma.', error.code ?? error.message);
  process.exitCode = 1;
});
