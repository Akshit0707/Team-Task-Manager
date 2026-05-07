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
    
    // Create tables if they don't exist
    await createTables();
    
    return client;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    throw error;
  }
}

async function createTables() {
  // Add your table creation queries here
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50),
      priority VARCHAR(50),
      project_id INT REFERENCES projects(id),
      assignee_id INT REFERENCES users(id),
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) {
    try {
      await client.query(query);
    } catch (error) {
      console.warn('Table creation warning:', error.message);
    }
  }
}

export function getClient() {
  return client;
}