import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import churnRoutes from './routes/churn';
import analyticsRoutes from './routes/analytics';
import interventionRoutes from './routes/interventions';
import taskRoutes from './routes/tasks';
import { authenticateToken } from './middleware/auth';
import { initializeDatabase } from './services/database';
import { setupWebSocket } from './services/websocket';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initializeDatabase();

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
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
