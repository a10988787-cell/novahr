import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

export const notificationRouter: Router = Router();
notificationRouter.use(authenticate);

// ---- GET /notifications ----

notificationRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { employeeId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { employeeId: req.user!.userId } }),
      prisma.notification.count({ where: { employeeId: req.user!.userId, read: false } }),
    ]);

    res.json({
      data: data.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /notifications/:id/read ----

notificationRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, employeeId: req.user!.userId },
      data: { read: true },
    });

    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
});
