import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { auditLog, setAuditBefore } from '../middleware/auditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  applyLeaveSchema,
  approveRejectSchema,
} from '../validators/leave.validators.js';

export const leaveRouter: Router = Router();

// All leave routes require authentication
leaveRouter.use(authenticate);

// ---- GET /leave/balance/me ----

leaveRouter.get('/balance/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentYear = new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: req.user!.userId, year: currentYear },
    });

    res.json({
      data: balances.map((b) => ({
        leaveType: b.leaveType,
        allotted: b.allotted,
        used: b.used,
        remaining: b.allotted - b.used,
        year: b.year,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---- POST /leave/requests — Apply for Leave ----

leaveRouter.post('/requests', auditLog('CREATE', 'leave_request'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = applyLeaveSchema.parse(req.body);
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Calculate number of days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId: req.user!.userId,
          leaveType: data.leaveType,
          year: currentYear,
        },
      },
    });

    if (!balance) {
      throw new AppError(400, 'NO_BALANCE', 'Leave balance not found for this leave type.');
    }

    const remaining = balance.allotted - balance.used;
    if (data.leaveType !== 'UNPAID' && diffDays > remaining) {
      throw new AppError(400, 'INSUFFICIENT_BALANCE',
        `Insufficient ${data.leaveType.toLowerCase()} leave balance. You have ${remaining} day(s) remaining but requested ${diffDays} day(s).`
      );
    }

    // Check for overlapping personal leave requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: req.user!.userId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });

    if (overlapping) {
      throw new AppError(409, 'OVERLAPPING_LEAVE',
        'You already have a leave request for overlapping dates.'
      );
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: req.user!.userId,
        leaveType: data.leaveType,
        startDate,
        endDate,
        remarks: data.remarks || null,
      },
      include: { employee: { select: { name: true } } },
    });

    // Create notification for managers/admin about new leave request
    const employee = await prisma.employee.findUnique({
      where: { id: req.user!.userId },
      select: { name: true, managerId: true, departmentId: true },
    });

    // Notify manager or all HR/Admin
    const notifyTargets = await prisma.employee.findMany({
      where: {
        OR: [
          { role: { in: ['ADMIN', 'HR'] } },
          ...(employee?.managerId ? [{ id: employee.managerId }] : []),
        ],
      },
      select: { id: true },
    });

    if (notifyTargets.length > 0) {
      await prisma.notification.createMany({
        data: notifyTargets.map((t) => ({
          employeeId: t.id,
          title: 'New Leave Request',
          message: `${employee?.name || 'An employee'} has requested ${data.leaveType.toLowerCase()} leave from ${data.startDate} to ${data.endDate}.`,
          type: 'LEAVE_STATUS' as const,
        })),
      });
    }

    res.status(201).json({
      id: leaveRequest.id,
      employeeId: leaveRequest.employeeId,
      employeeName: (leaveRequest as any).employee.name,
      leaveType: leaveRequest.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      remarks: leaveRequest.remarks,
      status: leaveRequest.status,
      days: diffDays,
      createdAt: leaveRequest.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /leave/requests/me — Own leave history ----

leaveRouter.get('/requests/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { employeeId: req.user!.userId },
        include: { approver: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leaveRequest.count({ where: { employeeId: req.user!.userId } }),
    ]);

    res.json({
      data: data.map((lr) => ({
        id: lr.id,
        leaveType: lr.leaveType,
        startDate: lr.startDate.toISOString().split('T')[0],
        endDate: lr.endDate.toISOString().split('T')[0],
        remarks: lr.remarks,
        status: lr.status,
        approverComment: lr.approverComment,
        approverName: (lr as any).approver?.name || null,
        createdAt: lr.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ---- GET /leave/requests — All/team requests (Admin/HR/Manager) ----

leaveRouter.get('/requests', authorize('ADMIN', 'HR', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string | undefined;
    const teamId = req.query.teamId as string | undefined;

    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    // If Manager, only show their direct reports
    if (req.user!.role === 'MANAGER') {
      const directReportIds = await prisma.employee.findMany({
        where: { managerId: req.user!.userId },
        select: { id: true },
      });
      where.employeeId = { in: directReportIds.map((r) => r.id) };
    } else if (teamId) {
      // Admin/HR can filter by department
      const teamMembers = await prisma.employee.findMany({
        where: { departmentId: teamId },
        select: { id: true },
      });
      where.employeeId = { in: teamMembers.map((m) => m.id) };
    }

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: { select: { name: true, employeeCode: true, departmentId: true } },
          approver: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    res.json({
      data: data.map((lr) => ({
        id: lr.id,
        employeeId: lr.employeeId,
        employeeName: (lr as any).employee.name,
        employeeCode: (lr as any).employee.employeeCode,
        leaveType: lr.leaveType,
        startDate: lr.startDate.toISOString().split('T')[0],
        endDate: lr.endDate.toISOString().split('T')[0],
        remarks: lr.remarks,
        status: lr.status,
        approverComment: lr.approverComment,
        approverName: (lr as any).approver?.name || null,
        createdAt: lr.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ---- PATCH /leave/requests/:id/approve ----

leaveRouter.patch('/requests/:id/approve',
  authorize('ADMIN', 'HR', 'MANAGER'),
  auditLog('APPROVE', 'leave_request'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment } = approveRejectSchema.parse(req.body);

      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: req.params.id as string },
        include: { employee: { select: { name: true, managerId: true } } },
      });

      if (!leaveRequest) {
        throw new AppError(404, 'NOT_FOUND', 'Leave request not found.');
      }

      if (leaveRequest.status !== 'PENDING') {
        throw new AppError(400, 'ALREADY_PROCESSED', `Leave request is already ${leaveRequest.status.toLowerCase()}.`);
      }

      const reqEmp = (leaveRequest as any).employee;

      // Manager can only approve their direct reports
      if (req.user!.role === 'MANAGER' && reqEmp.managerId !== req.user!.userId) {
        throw new AppError(403, 'FORBIDDEN', 'You can only approve leave for your direct reports.');
      }

      // Store before state for audit
      setAuditBefore(req, { status: leaveRequest.status });

      // Calculate days for balance update
      const diffTime = Math.abs(leaveRequest.endDate.getTime() - leaveRequest.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Update leave request
      const updated = await prisma.leaveRequest.update({
        where: { id: req.params.id as string },
        data: {
          status: 'APPROVED',
          approverId: req.user!.userId,
          approverComment: comment || null,
        },
      });

      // Decrement leave balance
      const currentYear = new Date().getFullYear();
      await prisma.leaveBalance.update({
        where: {
          employeeId_leaveType_year: {
            employeeId: leaveRequest.employeeId,
            leaveType: leaveRequest.leaveType,
            year: currentYear,
          },
        },
        data: { used: { increment: diffDays } },
      });

      // Notify the employee
      await prisma.notification.create({
        data: {
          employeeId: leaveRequest.employeeId,
          title: 'Leave Approved ✓',
          message: `Your ${leaveRequest.leaveType.toLowerCase()} leave from ${leaveRequest.startDate.toISOString().split('T')[0]} to ${leaveRequest.endDate.toISOString().split('T')[0]} has been approved.${comment ? ` Comment: ${comment}` : ''}`,
          type: 'LEAVE_STATUS',
        },
      });

      res.json({
        id: updated.id,
        status: updated.status,
        message: 'Leave request approved successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---- PATCH /leave/requests/:id/reject ----

leaveRouter.patch('/requests/:id/reject',
  authorize('ADMIN', 'HR', 'MANAGER'),
  auditLog('REJECT', 'leave_request'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment } = approveRejectSchema.parse(req.body);

      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: req.params.id as string },
        include: { employee: { select: { name: true, managerId: true } } },
      });

      if (!leaveRequest) {
        throw new AppError(404, 'NOT_FOUND', 'Leave request not found.');
      }

      if (leaveRequest.status !== 'PENDING') {
        throw new AppError(400, 'ALREADY_PROCESSED', `Leave request is already ${leaveRequest.status.toLowerCase()}.`);
      }

      const reqEmp = (leaveRequest as any).employee;

      if (req.user!.role === 'MANAGER' && reqEmp.managerId !== req.user!.userId) {
        throw new AppError(403, 'FORBIDDEN', 'You can only reject leave for your direct reports.');
      }

      setAuditBefore(req, { status: leaveRequest.status });

      const updated = await prisma.leaveRequest.update({
        where: { id: req.params.id as string },
        data: {
          status: 'REJECTED',
          approverId: req.user!.userId,
          approverComment: comment || null,
        },
      });

      // Notify the employee
      await prisma.notification.create({
        data: {
          employeeId: leaveRequest.employeeId,
          title: 'Leave Rejected ✗',
          message: `Your ${leaveRequest.leaveType.toLowerCase()} leave from ${leaveRequest.startDate.toISOString().split('T')[0]} to ${leaveRequest.endDate.toISOString().split('T')[0]} has been rejected.${comment ? ` Reason: ${comment}` : ''}`,
          type: 'LEAVE_STATUS',
        },
      });

      res.json({
        id: updated.id,
        status: updated.status,
        message: 'Leave request rejected.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---- GET /leave/conflicts — Smart Conflict Detection (P0 Differentiator!) ----

leaveRouter.get('/conflicts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError(400, 'INVALID_DATES', 'Please provide valid startDate and endDate query parameters.');
    }

    // Get the requesting employee's team (by department or manager)
    const employee = await prisma.employee.findUnique({
      where: { id: req.user!.userId },
      select: { departmentId: true, managerId: true },
    });

    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', 'Employee not found.');
    }

    // Find teammates (same department OR same manager)
    const teamWhere: any = {
      id: { not: req.user!.userId },
      status: 'active',
    };

    if (employee.departmentId) {
      teamWhere.departmentId = employee.departmentId;
    } else if (employee.managerId) {
      teamWhere.managerId = employee.managerId;
    }

    const teammates = await prisma.employee.findMany({
      where: teamWhere,
      select: { id: true, name: true },
    });

    const teamSize = teammates.length + 1; // including the requester

    // Find teammates who already have approved/pending leave overlapping the requested dates
    const conflictingLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: teammates.map((t) => t.id) },
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: { employee: { select: { name: true } } },
    });

    // Unique employees with conflicts
    const conflictingEmployeeIds = [...new Set(conflictingLeaves.map((l) => l.employeeId))];
    const conflictingNames = [...new Set(conflictingLeaves.map((l) => l.employee.name))];
    const conflictPercentage = teamSize > 1 ? Math.round((conflictingEmployeeIds.length / teamSize) * 100) : 0;

    // Conflict threshold: warn if >= 30% of team is off
    const CONFLICT_THRESHOLD = 30;
    const hasConflict = conflictPercentage >= CONFLICT_THRESHOLD;

    // Build human-readable message
    let message = '';
    if (hasConflict) {
      message = `⚠️ ${conflictingNames.length} of ${teamSize} team member(s) (${conflictPercentage}%) already have leave during this period: ${conflictingNames.join(', ')}. This may impact team capacity.`;
    } else if (conflictingNames.length > 0) {
      message = `ℹ️ ${conflictingNames.length} teammate(s) have leave during this period (${conflictPercentage}% of team), within acceptable limits.`;
    } else {
      message = '✅ No team members have overlapping leave during this period.';
    }

    res.json({
      hasConflict,
      conflictingCount: conflictingEmployeeIds.length,
      teamSize,
      conflictPercentage,
      conflictingEmployees: conflictingNames,
      blackoutPeriod: false, // TODO: implement admin-configurable blackout periods
      message,
    });
  } catch (err) {
    next(err);
  }
});
