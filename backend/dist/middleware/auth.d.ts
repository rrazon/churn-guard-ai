import { Request, Response, NextFunction } from 'express';
import { User } from '../types';
export interface AuthRequest extends Request {
    user?: User;
}
export declare function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireRole(roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function generateToken(userId: string): string;
//# sourceMappingURL=auth.d.ts.map