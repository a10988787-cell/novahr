import { z } from 'zod';

export const applyLeaveSchema = z.object({
  leaveType: z.enum(['PAID', 'SICK', 'UNPAID']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  remarks: z.string().max(500).optional(),
}).refine((data) => {
  return new Date(data.startDate) <= new Date(data.endDate);
}, { message: 'End date must be on or after start date', path: ['endDate'] });

export const approveRejectSchema = z.object({
  comment: z.string().max(500).optional(),
});

export const conflictCheckSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  teamId: z.string().optional(), // departmentId or managerId
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
export type ApproveRejectInput = z.infer<typeof approveRejectSchema>;
export type ConflictCheckInput = z.infer<typeof conflictCheckSchema>;
