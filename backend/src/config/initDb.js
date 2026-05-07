import pkg from 'pg';
const { Client } = pkg;

let client;

export default async function initializeDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.warn('⚠️  DATABASE_URL not set, skipping database initialization');
      return;
    }

    client = new Client({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    await client.connect();
    console.log('✓ Database connected successfully');

    await createTables();

    return client;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    throw error;
  }
}

async function createTables() {
  const queries = [
    // users — role column included from the start
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // add role column if table existed before this fix
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'`,

    `CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by INT REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS project_members (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_id)
    )`,

    `CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'todo',
      priority VARCHAR(50) DEFAULT 'medium',
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      assignee_id INT REFERENCES users(id) ON DELETE SET NULL,
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const q of queries) {
    try {
      await client.query(q);
    } catch (error) {
      if (error.code !== '42P07') throw error; // ignore "table already exists"
    }
  }

  console.log('✓ All tables initialized successfully');
}

export function getClient() {
  return client;
}