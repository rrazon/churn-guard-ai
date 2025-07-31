import { WebSocketServer, WebSocket } from 'ws';
import { database } from './database';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  subscriptions: string[];
}

const clients: ClientConnection[] = [];

export function setupWebSocket(wss: WebSocketServer) {
  console.log('🔌 Setting up WebSocket server...');

  wss.on('connection', (ws: WebSocket) => {
    console.log('📱 New WebSocket connection established');
    
    const client: ClientConnection = {
      ws,
      subscriptions: []
    };
    clients.push(client);

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(client, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('📱 WebSocket connection closed');
      const index = clients.indexOf(client);
      if (index > -1) {
        clients.splice(index, 1);
      }
    });

    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to ChurnGuard AI WebSocket server',
      timestamp: new Date().toISOString()
    }));
  });

  startPeriodicUpdates();
}

function handleClientMessage(client: ClientConnection, message: any) {
  switch (message.type) {
    case 'authenticate':
      client.userId = message.userId;
      client.ws.send(JSON.stringify({
        type: 'authenticated',
        userId: message.userId,
        timestamp: new Date().toISOString()
      }));
      break;

    case 'subscribe':
      if (message.channel && !client.subscriptions.includes(message.channel)) {
        client.subscriptions.push(message.channel);
        client.ws.send(JSON.stringify({
          type: 'subscribed',
          channel: message.channel,
          timestamp: new Date().toISOString()
        }));
      }
      break;

    case 'unsubscribe':
      if (message.channel) {
        const index = client.subscriptions.indexOf(message.channel);
        if (index > -1) {
          client.subscriptions.splice(index, 1);
          client.ws.send(JSON.stringify({
            type: 'unsubscribed',
            channel: message.channel,
            timestamp: new Date().toISOString()
          }));
        }
      }
      break;

    default:
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
        timestamp: new Date().toISOString()
      }));
  }
}

function startPeriodicUpdates() {
  setInterval(() => {
    broadcastHealthScoreUpdates();
  }, 30000);

  setInterval(() => {
    broadcastAlertNotifications();
  }, 60000);

  setInterval(() => {
    broadcastDashboardUpdates();
  }, 120000);
}

function broadcastHealthScoreUpdates() {
  const customersToUpdate = database.customers
    .filter(() => Math.random() < 0.1) // 10% chance for each customer
    .slice(0, 3); // Max 3 updates at once

  customersToUpdate.forEach(customer => {
    const change = (Math.random() - 0.5) * 10; // -5 to +5 points
    const newScore = Math.max(0, Math.min(100, customer.health_score + change));
    
    if (Math.abs(change) > 2) { // Only broadcast significant changes
      customer.health_score = Math.round(newScore);
      customer.updated_at = new Date();

      if (customer.health_score >= 80) customer.churn_risk_level = 'low';
      else if (customer.health_score >= 50) customer.churn_risk_level = 'medium';
      else if (customer.health_score >= 20) customer.churn_risk_level = 'high';
      else customer.churn_risk_level = 'critical';

      broadcastToSubscribers('health_updates', {
        type: 'health_score_update',
        customer_id: customer.id,
        company_name: customer.company_name,
        old_score: Math.round(newScore - change),
        new_score: customer.health_score,
        churn_risk_level: customer.churn_risk_level,
        timestamp: new Date().toISOString()
      });
    }
  });
}

function broadcastAlertNotifications() {
  const alertTypes = [
    'health_score_drop',
    'usage_anomaly',
    'payment_failure',
    'high_churn_probability'
  ];

  if (Math.random() < 0.3) { // 30% chance of generating an alert
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const customer = database.customers[Math.floor(Math.random() * database.customers.length)];

    const alert = {
      type: 'new_alert',
      alert_type: alertType,
      severity: customer.health_score < 30 ? 'critical' : customer.health_score < 60 ? 'high' : 'medium',
      customer_id: customer.id,
      company_name: customer.company_name,
      message: generateAlertMessage(alertType, customer.company_name),
      timestamp: new Date().toISOString()
    };

    broadcastToSubscribers('alerts', alert);
  }
}

function broadcastDashboardUpdates() {
  const totalCustomers = database.customers.length;
  const atRiskCustomers = database.customers.filter(c => 
    c.churn_risk_level === 'high' || c.churn_risk_level === 'critical'
  ).length;
  const avgHealthScore = Math.round(
    database.customers.reduce((sum, c) => sum + c.health_score, 0) / totalCustomers
  );
  const totalARR = database.customers.reduce((sum, c) => sum + (c.mrr * 12), 0);

  broadcastToSubscribers('dashboard', {
    type: 'dashboard_update',
    metrics: {
      total_customers: totalCustomers,
      at_risk_customers: atRiskCustomers,
      avg_health_score: avgHealthScore,
      total_arr: totalARR,
      churn_rate: Math.round((atRiskCustomers / totalCustomers) * 100 * 100) / 100
    },
    timestamp: new Date().toISOString()
  });
}

function broadcastToSubscribers(channel: string, data: any) {
  const message = JSON.stringify(data);
  
  clients.forEach(client => {
    if (client.subscriptions.includes(channel) && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  });
}

function generateAlertMessage(alertType: string, companyName: string): string {
  switch (alertType) {
    case 'health_score_drop':
      return `Health score for ${companyName} has dropped significantly`;
    case 'usage_anomaly':
      return `Unusual usage pattern detected for ${companyName}`;
    case 'payment_failure':
      return `Payment failure detected for ${companyName}`;
    case 'high_churn_probability':
      return `High churn probability detected for ${companyName}`;
    default:
      return `Alert for ${companyName}`;
  }
}

export function triggerTestNotification(type: string, customerId?: string) {
  const customer = customerId 
    ? database.customers.find(c => c.id === customerId)
    : database.customers[0];

  if (customer) {
    broadcastToSubscribers('alerts', {
      type: 'new_alert',
      alert_type: type,
      severity: 'high',
      customer_id: customer.id,
      company_name: customer.company_name,
      message: generateAlertMessage(type, customer.company_name),
      timestamp: new Date().toISOString()
    });
  }
}
