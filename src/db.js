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

function isLocalConnection(connectionString) {
  if (process.env.DB_SSL === 'false') return true;
  return /@(localhost|127\.0\.0\.1|db)(:|\/)/.test(connectionString);
}

function getPoolConfig() {
  const connectionString = buildConnectionString();
  const useSsl =
    process.env.DB_SSL === 'true' || !isLocalConnection(connectionString);

  if (!useSsl) {
    return { connectionString };
  }

  // RDS requires SSL — use explicit host config (more reliable than connectionString + ssl)
  const url = new URL(connectionString.replace(/^postgresql:\/\//, 'https://'));

  const config = {
    host: url.hostname,
    port: Number(url.port) || 5432,
    database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false },
  };

  console.log(`DB connecting to ${config.host}:${config.port}/${config.database} (SSL enabled)`);
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
