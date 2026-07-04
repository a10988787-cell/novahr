import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const attendanceRouter: Router = Router();
attendanceRouter.use(authenticate);

// ---- POST /attendance/check-in ----

attendanceRouter.post('/check-in', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: req.user!.userId,
          date: today,
        },
      },
    });

    if (existing?.checkInTime) {
      throw new AppError(400, 'ALREADY_CHECKED_IN', 'You have already checked in today.');
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: req.user!.userId,
          date: today,
        },
      },
      update: {
        checkInTime: new Date(),
        status: 'PRESENT',
      },
      create: {
        employeeId: req.user!.userId,
        date: today,
        checkInTime: new Date(),
        status: 'PRESENT',
      },
    });

    res.status(201).json({
      id: attendance.id,
      date: attendance.date.toISOString().split('T')[0],
      checkInTime: attendance.checkInTime?.toISOString(),
      status: attendance.status,
      message: 'Checked in successfully.',
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /attendance/check-out ----

attendanceRouter.post('/check-out', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: req.user!.userId,
          date: today,
        },
      },
    });

    if (!attendance?.checkInTime) {
      throw new AppError(400, 'NOT_CHECKED_IN', 'You have not checked in today.');
    }

    if (attendance.checkOutTime) {
      throw new AppError(400, 'ALREADY_CHECKED_OUT', 'You have already checked out today.');
    }

    const checkOutTime = new Date();

    // Auto half-day detection: if worked less than 4 hours
    const hoursWorked = (checkOutTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);
    const status = hoursWorked < 4 ? 'HALF_DAY' : 'PRESENT';

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        status,
      },
    });

    res.json({
      id: updated.id,
      date: updated.date.toISOString().split('T')[0],
      checkInTime: updated.checkInTime?.toISOString(),
      checkOutTime: updated.checkOutTime?.toISOString(),
      status: updated.status,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      message: 'Checked out successfully.',
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /attendance/me ----

attendanceRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const records = await prisma.attendance.findMany({
      where: {
        employeeId: req.user!.userId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      data: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        checkInTime: r.checkInTime?.toISOString() || null,
        checkOutTime: r.checkOutTime?.toISOString() || null,
        status: r.status,
        anomalyFlag: r.anomalyFlag,
        anomalyReason: r.anomalyReason,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /attendance (Admin/HR/Manager) ----

attendanceRouter.get('/', authorize('ADMIN', 'HR', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.query.employeeId as string | undefined;
    const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const where: any = { date: { gte: from, lte: to } };
    if (employeeId) where.employeeId = employeeId;

    const records = await prisma.attendance.findMany({
      where,
      include: { employee: { select: { name: true, employeeCode: true } } },
      orderBy: { date: 'desc' },
      take: 500,
    });

    res.json({
      data: records.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.name,
        employeeCode: r.employee.employeeCode,
        date: r.date.toISOString().split('T')[0],
        checkInTime: r.checkInTime?.toISOString() || null,
        checkOutTime: r.checkOutTime?.toISOString() || null,
        status: r.status,
        anomalyFlag: r.anomalyFlag,
        anomalyReason: r.anomalyReason,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /attendance/anomalies (Admin/HR) ----

attendanceRouter.get('/anomalies', authorize('ADMIN', 'HR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anomalies = await prisma.attendance.findMany({
      where: { anomalyFlag: true, reviewed: false },
      include: { employee: { select: { name: true, employeeCode: true } } },
      orderBy: { date: 'desc' },
    });

    res.json({
      data: anomalies.map((a) => ({
        id: a.id,
        employeeId: a.employeeId,
        employeeName: a.employee.name,
        employeeCode: a.employee.employeeCode,
        date: a.date.toISOString().split('T')[0],
        anomalyReason: a.anomalyReason,
        reviewed: a.reviewed,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /attendance/anomalies/:id (mark reviewed) ----

attendanceRouter.patch('/anomalies/:id', authorize('ADMIN', 'HR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await prisma.attendance.update({
      where: { id: req.params.id as string },
      data: { reviewed: true },
    });

    res.json({
      id: updated.id,
      reviewed: updated.reviewed,
      message: 'Anomaly marked as reviewed.',
    });
  } catch (err) {
    next(err);
  }
});
