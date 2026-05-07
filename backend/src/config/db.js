import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✓ Database connection established successfully');
});

pool.on('error', (err) => {
  console.error('✗ Unexpected error on idle client', err);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✓ Database is ready');
  }
});

export const query = (text, params) => {
  return pool.query(text, params);
};

export const getPool = () => pool;

export default pool;