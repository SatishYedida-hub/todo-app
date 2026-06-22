const { Pool } = require('pg');

function getPoolConfig() {
  let connectionString;

  if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL;
  } else {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 5432;
    const database = process.env.DB_NAME || 'todoapp';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || 'postgres';
    connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  const config = { connectionString };

  // RDS requires SSL; local Docker Postgres does not
  const useSsl =
    process.env.DB_SSL === 'true' ||
    (process.env.DB_SSL !== 'false' && connectionString.includes('rds.amazonaws.com'));

  if (useSsl) {
    config.ssl = { rejectUnauthorized: false };
  }

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
