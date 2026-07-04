import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const employeeRouter: Router = Router();

// All employee routes require authentication
employeeRouter.use(authenticate);

// ---- GET /employees/me ----

employeeRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.user!.userId },
      include: {
        department: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });

    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', 'Employee not found.');
    }

    const emp = employee as any;
    res.json({
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      departmentId: emp.departmentId,
      departmentName: emp.department?.name || null,
      managerId: emp.managerId,
      managerName: emp.manager?.name || null,
      phone: emp.phone,
      address: emp.address,
      photoUrl: emp.photoUrl,
      status: emp.status,
      createdAt: emp.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /employees/me ----

employeeRouter.patch('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Employees can only update limited fields
    const allowedFields = ['phone', 'address', 'photoUrl'];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError(400, 'NO_CHANGES', 'No valid fields to update.');
    }

    const employee = await prisma.employee.update({
      where: { id: req.user!.userId },
      data: updates,
    });

    res.json({
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      address: employee.address,
      photoUrl: employee.photoUrl,
      message: 'Profile updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /employees (Admin/HR) ----

employeeRouter.get('/', authorize('ADMIN', 'HR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          role: true,
          status: true,
          department: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      data: data.map((e: any) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        name: e.name,
        email: e.email,
        role: e.role,
        department: e.department?.name || null,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /employees/:id ----

employeeRouter.get('/:id', authorize('ADMIN', 'HR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id as string },
      include: {
        department: { select: { name: true } },
        manager: { select: { name: true } },
        skills: true,
      },
    });

    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', 'Employee not found.');
    }

    const emp = employee as any;
    res.json({
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      departmentId: emp.departmentId,
      departmentName: emp.department?.name || null,
      managerId: emp.managerId,
      managerName: emp.manager?.name || null,
      phone: emp.phone,
      address: emp.address,
      photoUrl: emp.photoUrl,
      status: emp.status,
      skills: emp.skills,
      createdAt: emp.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ---- PUT /employees/:id (Full edit — Admin/HR) ----

employeeRouter.put('/:id', authorize('ADMIN', 'HR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.params.id as string } });
    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', 'Employee not found.');
    }

    const updated = await prisma.employee.update({
      where: { id: req.params.id as string },
      data: {
        name: req.body.name,
        role: req.body.role,
        departmentId: req.body.departmentId,
        managerId: req.body.managerId,
        phone: req.body.phone,
        address: req.body.address,
        status: req.body.status,
      },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      message: 'Employee updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});
