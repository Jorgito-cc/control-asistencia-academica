const { databaseUrl } = require('./config');
const { createPool, migrate } = require('./runtime/db');

async function main() {
  const pool = createPool(databaseUrl());
  try {
    await migrate(pool);
    console.log('Migraciones de la plataforma aplicadas.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('No se pudieron aplicar las migraciones de plataforma.', error.code ?? error.message);
  process.exitCode = 1;
});
