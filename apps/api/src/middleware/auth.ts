import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware: verifies JWT access token from Authorization header.
 * Attaches decoded user to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header.');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new AppError(500, 'CONFIG_ERROR', 'JWT_ACCESS_SECRET is not configured.');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    if ((err as any).name === 'TokenExpiredError') {
      next(new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired. Please refresh.'));
      return;
    }
    next(new AppError(401, 'INVALID_TOKEN', 'Invalid access token.'));
  }
}

/**
 * Middleware factory: restricts access to specific roles.
 * Usage: authorize('ADMIN', 'HR')
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, 'FORBIDDEN', `Access denied. Required role(s): ${allowedRoles.join(', ')}.`));
      return;
    }

    next();
  };
}
