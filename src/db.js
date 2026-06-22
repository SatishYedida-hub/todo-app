const { Pool } = require('pg');

function buildConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || 'todoapp';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

function parseConnectionString(connectionString) {
  const normalized = connectionString
    .replace(/^postgresql:\/\//, 'https://')
    .replace(/^postgres:\/\//, 'https://');

  const url = new URL(normalized);

  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    database: decodeURIComponent(url.pathname.slice(1).split('?')[0]),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

function shouldUseSsl(host) {
  if (process.env.DB_SSL === 'false') return false;
  if (process.env.DB_SSL === 'true') return true;
  if (host === 'localhost' || host === '127.0.0.1' || host === 'db') return false;
  return true;
}

function getPoolConfig() {
  const parsed = parseConnectionString(buildConnectionString());
  const config = { ...parsed };

  if (shouldUseSsl(parsed.host)) {
    config.ssl = { rejectUnauthorized: false };
  }

  console.log(
    `DB config: host=${parsed.host} ssl=${Boolean(config.ssl)} DB_SSL=${process.env.DB_SSL || 'unset'}`
  );

  return config;
}

const pool = new Pool(getPoolConfig());

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initDb };
