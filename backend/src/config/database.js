const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

async function initializeDatabase() {
  let retries = 10;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('Database connected successfully');
      client.release();
      return;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error('Failed to connect to database:', err.message);
        throw err;
      }
      console.log(`Database not ready, retrying in 3s... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

module.exports = { pool, initializeDatabase };
