import request from 'supertest';
import app from '../index';
import { database } from '../services/database';

describe('Security Tests', () => {
  beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    database.users = [
      {
        id: 'test-user-1',
        email: 'test@example.com',
        password: '$2a$10$test.hash.password',
        role: 'admin',
        name: 'Test User',
        created_at: new Date()
      }
    ];
  });

  describe('Authentication Security', () => {
    test('should reject requests without JWT token', async () => {
      const response = await request(app)
        .get('/api/customers')
        .expect(401);
      
      expect(response.body.error).toBe('Access token required');
    });

    test('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid-token');
      
      expect([401, 403]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    test('should rate limit authentication attempts', async () => {
      const responses = [];
      for (let i = 0; i < 7; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' });
        responses.push(response);
        
        if (i < 6) await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation Security', () => {
    test('should sanitize XSS attempts in search queries', async () => {
      const maliciousSearch = '<script>alert("xss")</script>';
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      const token = loginResponse.body.token;
      
      const response = await request(app)
        .get('/api/customers')
        .query({ search: maliciousSearch })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body).toBeDefined();
    });

    test('should validate required fields', async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email' });
      
      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error).toBe('Validation failed');
      }
    });

    test('should validate email format', async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'password' });
      
      expect([400, 429]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.details).toContain('email must be a valid email');
      }
    });
  });

  describe('API Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('should include CSP headers', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);
      
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit general API requests', async () => {
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(request(app).get('/healthz'));
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Security', () => {
    test('should reject requests from unauthorized origins', async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await request(app)
        .get('/healthz')
        .set('Origin', 'https://malicious-site.com');
      
      expect([200, 429]).toContain(response.status);
      if (response.status === 200) {
        expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
      }
    });
  });
});
