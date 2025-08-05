import express from 'express';
import bcrypt from 'bcryptjs';
import { database } from '../services/database';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { auditLogger } from '../services/auditLogger';

const router = express.Router();

router.post('/login', validateRequest([
  { field: 'email', required: true, type: 'email', sanitize: true },
  { field: 'password', required: true, type: 'string', minLength: 1, maxLength: 100 }
]), async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    const user = database.users.find(u => u.email === email);
    if (!user) {
      auditLogger.log({
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        details: { email, reason: 'User not found' }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      auditLogger.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        details: { email, reason: 'Invalid password' }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    auditLogger.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    auditLogger.log({
      action: 'LOGIN_ERROR',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      return 'churn-guard-ai-secret-key-demo';
    })();
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = database.users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/refresh', validateRequest([
  { field: 'refreshToken', required: true, type: 'string' }
]), async (req, res) => {
  try {
    const { refreshToken } = req.validatedData;
    
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      auditLogger.log({
        action: 'REFRESH_TOKEN_FAILED',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        details: { reason: 'Invalid refresh token' }
      });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = database.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    auditLogger.log({
      userId: user.id,
      action: 'TOKEN_REFRESHED',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
