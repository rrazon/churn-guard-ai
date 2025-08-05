import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import churnRoutes from './routes/churn';
import analyticsRoutes from './routes/analytics';
import interventionRoutes from './routes/interventions';
import taskRoutes from './routes/tasks';
import { authenticateToken } from './middleware/auth';
import { generalRateLimit, authRateLimit, addSecurityHeaders } from './middleware/security';
import { initializeDatabase } from './services/database';
import { setupWebSocket } from './services/websocket';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'churn-guard-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(addSecurityHeaders);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalRateLimit);

initializeDatabase();

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/churn', authenticateToken, churnRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/interventions', authenticateToken, interventionRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);

const server = createServer(app);

const wss = new WebSocketServer({ server });
setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`🚀 ChurnGuard AI Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
});

export default app;
