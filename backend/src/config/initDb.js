import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async () => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      console.log('⏭️  Skipping database initialization (not in development mode)');
      return;
    }

    console.log('🔧 Initializing database schema...');

    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    const enums = [
      "CREATE TYPE user_role AS ENUM ('admin', 'member')",
      "CREATE TYPE project_status AS ENUM ('active', 'archived')",
      "CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done')",
      "CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high')",
      "CREATE TYPE project_member_role AS ENUM ('admin', 'member')",
    ];

    for (const enumQuery of enums) {
      try {
        await query(enumQuery);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('CREATE TYPE') && !stmt.startsWith('CREATE EXTENSION'));

    for (const statement of statements) {
      await query(statement);
    }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
};

export default initializeDatabase;