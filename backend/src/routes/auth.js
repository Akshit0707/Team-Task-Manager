import express from 'express';
import { getClient } from '../config/initDb.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'member' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    req.user = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET || 'your-secret-key'
    );
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const client = getClient();
    if (!client) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }

    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role || 'member' },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// ── POST /api/auth/signup ─────────────────────────────────────────────────────

router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const client = getClient();
    if (!client) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await client.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'member']
    );

    const user = result.rows[0];
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});


router.get('/me', verifyToken, async (req, res) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }

    const result = await client.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;