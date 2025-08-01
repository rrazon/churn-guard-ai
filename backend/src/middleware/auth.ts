import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { database } from '../services/database';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'churn-guard-ai-secret-key-demo';

export interface AuthRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const user = database.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  });
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}
