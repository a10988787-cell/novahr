import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const payrollRouter: Router = Router();
payrollRouter.use(authenticate);

// ---- GET /payroll/me ----

payrollRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payroll = await prisma.payroll.findMany({
      where: { employeeId: req.user!.userId },
      orderBy: { effectiveMonth: 'desc' },
      take: 12,
    });

    res.json({
      data: payroll.map((p) => ({
        id: p.id,
        baseSalary: Number(p.baseSalary),
        allowances: p.allowancesJson as Record<string, number>,
        deductions: p.deductionsJson as Record<string, number>,
        effectiveMonth: p.effectiveMonth,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /payroll (Admin) ----

payrollRouter.get('/', authorize('ADMIN', 'HR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.query.employeeId as string | undefined;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const payroll = await prisma.payroll.findMany({
      where,
      include: { employee: { select: { name: true, employeeCode: true } } },
      orderBy: { effectiveMonth: 'desc' },
    });

    res.json({
      data: payroll.map((p) => ({
        id: p.id,
        employeeId: p.employeeId,
        employeeName: p.employee.name,
        employeeCode: p.employee.employeeCode,
        baseSalary: Number(p.baseSalary),
        allowances: p.allowancesJson,
        deductions: p.deductionsJson,
        effectiveMonth: p.effectiveMonth,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---- PUT /payroll/:employeeId (Admin) ----

payrollRouter.put('/:employeeId', authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { baseSalary, allowances, deductions, effectiveMonth } = req.body;

    const employeeIdParam = req.params.employeeId as string;

    const payroll = await prisma.payroll.upsert({
      where: {
        employeeId_effectiveMonth: {
          employeeId: employeeIdParam,
          effectiveMonth: effectiveMonth,
        },
      },
      update: {
        baseSalary,
        allowancesJson: allowances || {},
        deductionsJson: deductions || {},
        updatedById: req.user!.userId,
      },
      create: {
        employeeId: employeeIdParam,
        baseSalary,
        allowancesJson: allowances || {},
        deductionsJson: deductions || {},
        effectiveMonth,
        updatedById: req.user!.userId,
      },
    });

    res.json({
      id: payroll.id,
      message: 'Payroll updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});
