import { validateRequest, sanitizeSearchQuery } from '../middleware/validation';
import { Request, Response, NextFunction } from 'express';

describe('Validation Middleware Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('validateRequest', () => {
    test('should pass validation for valid data', () => {
      mockReq.body = { email: 'test@example.com', age: 25 };
      
      const middleware = validateRequest([
        { field: 'email', required: true, type: 'email' },
        { field: 'age', required: true, type: 'number', min: 18, max: 100 }
      ]);
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedData).toEqual({ email: 'test@example.com', age: 25 });
    });

    test('should fail validation for missing required fields', () => {
      mockReq.body = { email: 'test@example.com' };
      
      const middleware = validateRequest([
        { field: 'email', required: true, type: 'email' },
        { field: 'password', required: true, type: 'string' }
      ]);
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['password is required']
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should sanitize string inputs when sanitize is true', () => {
      mockReq.body = { name: '<script>alert("xss")</script>John' };
      
      const middleware = validateRequest([
        { field: 'name', required: true, type: 'string', sanitize: true }
      ]);
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedData.name).not.toContain('<script>');
    });

    test('should validate enum values', () => {
      mockReq.body = { status: 'invalid' };
      
      const middleware = validateRequest([
        { field: 'status', required: true, type: 'string', enum: ['active', 'inactive', 'pending'] }
      ]);
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['status must be one of: active, inactive, pending']
      });
    });

    test('should validate number ranges', () => {
      mockReq.body = { score: 150 };
      
      const middleware = validateRequest([
        { field: 'score', required: true, type: 'number', min: 0, max: 100 }
      ]);
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['score must be at most 100']
      });
    });

    test('should validate string length', () => {
      mockReq.body = { name: 'ab' };
      
      const middleware = validateRequest([
        { field: 'name', required: true, type: 'string', minLength: 3, maxLength: 50 }
      ]);
      
      middleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['name must be at least 3 characters']
      });
    });
  });

  describe('sanitizeSearchQuery', () => {
    test('should remove dangerous characters', () => {
      const maliciousQuery = '<script>alert("xss")</script>search term';
      const sanitized = sanitizeSearchQuery(maliciousQuery);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('search term');
    });

    test('should handle empty or null inputs', () => {
      expect(sanitizeSearchQuery('')).toBe('');
      expect(sanitizeSearchQuery(null as any)).toBe('');
      expect(sanitizeSearchQuery(undefined as any)).toBe('');
    });

    test('should escape HTML entities', () => {
      const query = 'search & filter';
      const sanitized = sanitizeSearchQuery(query);
      
      expect(sanitized).toBe('search &amp; filter');
    });
  });
});
