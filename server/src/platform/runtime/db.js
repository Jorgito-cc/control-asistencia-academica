const { readdir, readFile } = require('node:fs/promises');
const path = require('node:path');
const { Pool } = require('pg');

function createPool(connectionString) {
  let database;
  try {
    database = new URL(connectionString);
  } catch {
    throw new Error('PLATFORM_DATABASE_URL debe ser una URL PostgreSQL válida.');
  }
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || database.pathname.length < 2) {
    throw new Error('PLATFORM_DATABASE_URL debe incluir una base de datos PostgreSQL.');
  }
  return new Pool({ connectionString, connectionTimeoutMillis: 5000 });
}

async function transaction(pool, operation) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function migrate(pool) {
  const directory = path.join(__dirname, '..', 'migrations');
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  await transaction(pool, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(4300001)');
    const { rows: [existing] } = await client.query(
      "SELECT to_regclass('public.admins') IS NOT NULL AND to_regclass('public.modules') IS NOT NULL AS attendance_db",
    );
    if (existing.attendance_db) {
      throw new Error('PLATFORM_DATABASE_URL apunta a la base de asistencia. Usa una base exclusiva de la plataforma.');
    }
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const { rows } = await client.query('SELECT name FROM platform_schema_migrations');
    const applied = new Set(rows.map((row) => row.name));
    for (const file of files) {
      if (applied.has(file)) continue;
      await client.query(await readFile(path.join(directory, file), 'utf8'));
      await client.query('INSERT INTO platform_schema_migrations (name) VALUES ($1)', [file]);
    }
  });
}

module.exports = { createPool, migrate, transaction };
