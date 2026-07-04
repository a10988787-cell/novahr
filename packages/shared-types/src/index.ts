// ============================================
// NovaHR — Shared Types & API Contract
// ============================================

// ---- Enums ----

export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  HR = 'HR',
}

export enum LeaveType {
  PAID = 'PAID',
  SICK = 'SICK',
  UNPAID = 'UNPAID',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
}

// ---- Auth Types ----

export interface SignupRequest {
  employeeId: string;
  email: string;
  password: string;
  role: Role;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ---- User / Employee Types ----

export interface UserProfile {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  managerId: string | null;
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  status: 'active' | 'inactive';
}

// ---- Attendance Types ----

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  geoFlag: boolean;
  anomalyFlag: boolean;
  anomalyReason: string | null;
}

export interface CheckInRequest {
  latitude?: number;
  longitude?: number;
  qrCode?: string;
}

export interface AttendanceAnomaly {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  anomalyReason: string;
  reviewed: boolean;
}

// ---- Leave Types ----

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remarks: string | null;
  status: LeaveStatus;
  approverId: string | null;
  approverComment: string | null;
  createdAt: string;
}

export interface ApplyLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remarks?: string;
}

export interface LeaveBalance {
  leaveType: LeaveType;
  allotted: number;
  used: number;
  remaining: number;
  year: number;
}

export interface LeaveConflict {
  hasConflict: boolean;
  conflictingCount: number;
  teamSize: number;
  conflictPercentage: number;
  conflictingEmployees: string[];
  blackoutPeriod: boolean;
  message: string;
}

export interface ApproveRejectRequest {
  comment?: string;
}

// ---- Payroll Types ----

export interface PayrollRecord {
  id: string;
  employeeId: string;
  baseSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  netSalary: number;
  effectiveMonth: string;
}

// ---- Wellness & Risk Types ----

export interface WellnessScore {
  id: string;
  employeeId: string;
  score: number;
  factors: {
    overtimeHours: number;
    leaveUtilization: number;
    daysSinceLastBreak: number;
    daysSinceLastKudos: number;
  };
  computedAt: string;
}

export interface AttritionRisk {
  employeeId: string;
  employeeName: string;
  riskScore: number;
  factors: {
    label: string;
    value: number;
    weight: number;
    contribution: number;
  }[];
}

// ---- Kudos Types ----

export interface Kudos {
  id: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  message: string;
  createdAt: string;
}

export interface GiveKudosRequest {
  toEmployeeId: string;
  message: string;
}

// ---- Notification Types ----

export interface Notification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  type: 'leave_status' | 'anomaly' | 'kudos' | 'system';
  read: boolean;
  createdAt: string;
}

// ---- Copilot Types ----

export interface CopilotChatRequest {
  message: string;
  sessionId: string;
}

export interface CopilotChatResponse {
  reply: string;
  sources: {
    type: 'db' | 'policy';
    ref: string;
    employeeId?: string;
  }[];
  sessionId: string;
}

// ---- Common Types ----

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: string;
}
