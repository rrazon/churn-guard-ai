import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'uuid' | 'boolean';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[];
  sanitize?: boolean;
}

export function validateRequest(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const sanitizedData: any = {};

    for (const rule of rules) {
      const value = (req.body && req.body[rule.field]) || 
                   (req.query && req.query[rule.field]) || 
                   (req.params && req.params[rule.field]);

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      let sanitizedValue = value;

      if (rule.sanitize && typeof value === 'string') {
        sanitizedValue = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
        sanitizedValue = validator.escape(sanitizedValue);
      }

      switch (rule.type) {
        case 'string':
          if (typeof sanitizedValue !== 'string') {
            errors.push(`${rule.field} must be a string`);
            continue;
          }
          if (rule.minLength && sanitizedValue.length < rule.minLength) {
            errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
            errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
          }
          break;

        case 'number':
          const numValue = Number(sanitizedValue);
          if (isNaN(numValue)) {
            errors.push(`${rule.field} must be a number`);
            continue;
          }
          sanitizedValue = numValue;
          if (rule.min !== undefined && numValue < rule.min) {
            errors.push(`${rule.field} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && numValue > rule.max) {
            errors.push(`${rule.field} must be at most ${rule.max}`);
          }
          break;

        case 'email':
          if (!validator.isEmail(sanitizedValue)) {
            errors.push(`${rule.field} must be a valid email`);
          }
          break;

        case 'uuid':
          if (!validator.isUUID(sanitizedValue)) {
            errors.push(`${rule.field} must be a valid UUID`);
          }
          break;

        case 'boolean':
          if (typeof sanitizedValue !== 'boolean' && sanitizedValue !== 'true' && sanitizedValue !== 'false') {
            errors.push(`${rule.field} must be a boolean`);
            continue;
          }
          sanitizedValue = sanitizedValue === true || sanitizedValue === 'true';
          break;
      }

      if (rule.enum && !rule.enum.includes(sanitizedValue)) {
        errors.push(`${rule.field} must be one of: ${rule.enum.join(', ')}`);
      }

      sanitizedData[rule.field] = sanitizedValue;
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    req.validatedData = sanitizedData;
    next();
  };
}

export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  let sanitized = DOMPurify.sanitize(query, { ALLOWED_TAGS: [] });
  sanitized = validator.escape(sanitized);
  sanitized = sanitized.replace(/[<>'"]/g, '');
  
  return sanitized.trim();
}

declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}
