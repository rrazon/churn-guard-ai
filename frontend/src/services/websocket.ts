interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  connect(userId?: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket('ws://localhost:8000');

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        if (userId) {
          this.send({
            type: 'authenticate',
            userId,
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  subscribe(channel: string, handler: MessageHandler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
    }
    this.handlers.get(channel)!.push(handler);

    this.send({
      type: 'subscribe',
      channel,
    });

    return () => {
      const handlers = this.handlers.get(channel);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        if (handlers.length === 0) {
          this.handlers.delete(channel);
          this.send({
            type: 'unsubscribe',
            channel,
          });
        }
      }
    };
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'health_score_update':
        this.notifyHandlers('health_updates', message);
        break;
      case 'new_alert':
        this.notifyHandlers('alerts', message);
        break;
      case 'dashboard_update':
        this.notifyHandlers('dashboard', message);
        break;
      default:
        if (message.channel) {
          this.notifyHandlers(message.channel, message);
        }
    }
  }

  private notifyHandlers(channel: string, message: WebSocketMessage) {
    const handlers = this.handlers.get(channel);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
}

export const wsService = new WebSocketService();
