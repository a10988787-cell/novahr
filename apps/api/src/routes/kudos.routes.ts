import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const kudosRouter: Router = Router();
kudosRouter.use(authenticate);

// ---- POST /kudos ----

kudosRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toEmployeeId, message } = req.body;

    if (!toEmployeeId || !message) {
      throw new AppError(400, 'VALIDATION_ERROR', 'toEmployeeId and message are required.');
    }

    if (toEmployeeId === req.user!.userId) {
      throw new AppError(400, 'SELF_KUDOS', 'You cannot give kudos to yourself.');
    }

    // Verify target employee exists
    const target = await prisma.employee.findUnique({ where: { id: toEmployeeId } });
    if (!target) {
      throw new AppError(404, 'NOT_FOUND', 'Target employee not found.');
    }

    const kudos = await prisma.kudos.create({
      data: {
        fromEmployeeId: req.user!.userId,
        toEmployeeId,
        message,
      },
      include: {
        fromEmployee: { select: { name: true } },
        toEmployee: { select: { name: true } },
      },
    });

    // Notify the recipient
    await prisma.notification.create({
      data: {
        employeeId: toEmployeeId,
        title: '🎉 You received kudos!',
        message: `${kudos.fromEmployee.name} says: "${message}"`,
        type: 'KUDOS',
      },
    });

    res.status(201).json({
      id: kudos.id,
      fromEmployeeName: kudos.fromEmployee.name,
      toEmployeeName: kudos.toEmployee.name,
      message: kudos.message,
      createdAt: kudos.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /kudos/feed ----

kudosRouter.get('/feed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [data, total] = await Promise.all([
      prisma.kudos.findMany({
        include: {
          fromEmployee: { select: { name: true, photoUrl: true } },
          toEmployee: { select: { name: true, photoUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kudos.count(),
    ]);

    res.json({
      data: data.map((k) => ({
        id: k.id,
        fromEmployeeName: k.fromEmployee.name,
        fromEmployeePhoto: k.fromEmployee.photoUrl,
        toEmployeeName: k.toEmployee.name,
        toEmployeePhoto: k.toEmployee.photoUrl,
        message: k.message,
        createdAt: k.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});
