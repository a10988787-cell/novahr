import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * Middleware factory: creates audit log entries for all mutating endpoints.
 * Wraps the route handler to capture before/after state.
 *
 * Usage: router.patch('/resource/:id', authenticate, auditLog('UPDATE', 'resource'), handler)
 */
export function auditLog(action: string, entity: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Only log for successful mutations (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = req.params.id || body?.id || 'unknown';

        // Fire and forget — don't block the response
        prisma.auditLog.create({
          data: {
            actorId: req.user.userId,
            action,
            entity,
            entityId: String(entityId),
            beforeJson: (req as any)._auditBefore || null,
            afterJson: body?.data || body || null,
            timestamp: new Date(),
          },
        }).catch((err) => {
          console.error('[AUDIT] Failed to write audit log:', err.message);
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Helper: capture the "before" state of an entity for audit logging.
 * Call this in your route handler before making changes.
 */
export function setAuditBefore(req: Request, before: Record<string, unknown> | null): void {
  (req as any)._auditBefore = before;
}
