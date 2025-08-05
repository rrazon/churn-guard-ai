interface AuditEvent {
  timestamp: Date;
  userId?: string;
  action: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}

class AuditLogger {
  private events: AuditEvent[] = [];

  log(event: Omit<AuditEvent, 'timestamp'>) {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date()
    };
    
    this.events.push(auditEvent);
    
    if (event.success) {
      console.log(`[AUDIT] ${event.action} - User: ${event.userId || 'anonymous'} - Success`);
    } else {
      console.warn(`[AUDIT] ${event.action} - User: ${event.userId || 'anonymous'} - Failed - ${JSON.stringify(event.details)}`);
    }
    
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }

  getEvents(limit: number = 100): AuditEvent[] {
    return this.events.slice(-limit);
  }

  getFailedEvents(limit: number = 50): AuditEvent[] {
    return this.events.filter(e => !e.success).slice(-limit);
  }
}

export const auditLogger = new AuditLogger();
